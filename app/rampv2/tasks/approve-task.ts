import { getSDKConfig } from "@renegade-fi/react";
import { writeContract } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { zeroAddress } from "@/lib/token";
import { USDT_MAINNET_ADDRESS, usdtAbi } from "@/lib/usdtAbi";
import { getExplorerLink, solana } from "@/lib/viem";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import type { PlannedTask } from "../planner/task-planner";
import type { DepositTask } from "./deposit-task";
import { ensureCorrectChain } from "./helpers/evm-utils";
import type { LiFiLegTask } from "./lifi-leg-task";

type ApproveKind = "Permit2" | "Bridge" | "Swap" | "Unwrap";

interface ApproveDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
    readonly spender: `0x${string}`;
    readonly approveKind: ApproveKind;
}

type ApproveState = "Pending" | "AwaitingWallet" | "Submitted" | "Completed";

class ApproveError extends Error implements BaseTaskError {
    constructor(
        message: string,
        private readonly _retryable: boolean = true,
    ) {
        super(message);
    }
    retryable() {
        return this._retryable;
    }
}

export class ApproveTask extends Task<ApproveDescriptor, ApproveState, ApproveError> {
    private _state: ApproveState = "Pending";
    private _request?: Parameters<typeof writeContract>[1];
    private _txHash?: `0x${string}`;

    constructor(
        public readonly descriptor: ApproveDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
    }

    static create(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        spender: `0x${string}`,
        approveKind: ApproveKind,
        ctx: TaskContext,
    ): ApproveTask {
        const desc: ApproveDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.APPROVE,
            chainId,
            mint,
            amount,
            spender,
            approveKind,
        };
        return new ApproveTask(desc, ctx);
    }

    name() {
        const kind = this.descriptor.approveKind;
        return kind ? `Approve ${kind}` : "Approve";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    async step(): Promise<void> {
        const { chainId, mint, amount, spender } = this.descriptor;
        const pc = this.ctx.getPublicClient(chainId);

        switch (this._state) {
            case "Pending": {
                await ensureCorrectChain(this.ctx, chainId);

                const owner = this.ctx.getOnchainAddress(chainId) as `0x${string}`;
                if (!owner) throw new ApproveError("Wallet account not found", false);

                const isUsdt = chainId === 1 && mint.toLowerCase() === USDT_MAINNET_ADDRESS;
                const abiOverride = isUsdt ? usdtAbi : erc20Abi;

                const { request } = await pc.simulateContract({
                    abi: abiOverride,
                    address: mint,
                    functionName: "approve",
                    args: [spender, amount],
                    account: owner,
                });

                this._request = request;
                this._state = "AwaitingWallet";
                break;
            }
            case "AwaitingWallet": {
                if (!this._request) throw new ApproveError("Missing request", false);
                try {
                    const txHash = await writeContract(this.ctx.wagmiConfig, this._request);
                    this._txHash = txHash;
                    this._state = "Submitted";
                } catch (e) {
                    console.error("Error in ApproveTask", e);
                    throw new ApproveError("Failed to send transaction", false);
                }
                break;
            }
            case "Submitted": {
                if (!this._txHash) throw new ApproveError("Missing txHash", false);
                await pc.waitForTransactionReceipt({ hash: this._txHash });
                this._state = "Completed";
                break;
            }
            default:
                throw new ApproveError("step() called after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }

    explorerLink(): string | undefined {
        if (!this._txHash) return undefined;
        return getExplorerLink(this._txHash as string, this.descriptor.chainId);
    }

    /**
     * Determine if *this specific instance* of ApproveTask should stay in the plan.
     * Falls back to `true` on any unexpected error to be conservative.
     */
    async isNeeded(_ctx: TaskContext): Promise<boolean> {
        const { chainId, mint, spender, amount } = this.descriptor;
        try {
            const pc = this.ctx.getPublicClient(chainId);
            const owner = this.ctx.getOnchainAddress(chainId) as `0x${string}`;
            if (!owner) return true; // be conservative if owner missing
            const allowance: bigint = await pc.readContract({
                abi: erc20Abi,
                address: mint,
                functionName: "allowance",
                args: [owner, spender],
            });
            return allowance < amount;
        } catch {
            return true; // fallback to requiring approval
        }
    }

    /**
     * Helper to derive an ApproveTask from a core planned task. Returns undefined
     * if no approval is relevant (e.g. spender undefined, native token, Solana).
     */
    static fromCoreTask(task: PlannedTask, ctx: TaskContext): ApproveTask | undefined {
        switch (task.descriptor.type) {
            case TASK_TYPES.DEPOSIT: {
                const dep = task as DepositTask;
                const { chainId, mint, amount } = dep.descriptor;
                const spender = getSDKConfig(chainId).permit2Address as `0x${string}`;
                return ApproveTask.create(chainId, mint, amount, spender, "Permit2", ctx);
            }
            case TASK_TYPES.LIFI_LEG: {
                const legTask = task as LiFiLegTask;
                const { chainId, mint, amount } = legTask;
                if (chainId === solana.id) return undefined;
                if (mint === zeroAddress) return undefined; // native ETH
                const spender = legTask.descriptor.leg.estimate?.approvalAddress as
                    | `0x${string}`
                    | undefined;
                if (!spender) return undefined;
                const isBridge = legTask.isBridgeOperation();
                const isWrap = legTask.isWrapOperation();
                const isSwap = legTask.isSwapOperation();
                const kind: ApproveKind = isBridge
                    ? "Bridge"
                    : isWrap
                      ? "Unwrap"
                      : isSwap
                        ? "Swap"
                        : "Permit2";
                return ApproveTask.create(chainId, mint, amount, spender, kind, ctx);
            }
            default:
                return undefined;
        }
    }
}
