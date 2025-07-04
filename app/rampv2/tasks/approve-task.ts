import { getSDKConfig } from "@renegade-fi/react";
import { writeContract } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { zeroAddress } from "@/lib/token";
import { USDT_MAINNET_ADDRESS, usdtAbi } from "@/lib/usdtAbi";
import { solana } from "@/lib/viem";
import type { TaskError as BaseTaskError, Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";

export interface ApproveDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
    readonly spender: `0x${string}`;
}

export enum ApproveState {
    Pending,
    Submitted,
    Completed,
}

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

export class ApproveTask implements Task<ApproveDescriptor, ApproveState, ApproveError> {
    private _state: ApproveState = ApproveState.Pending;
    private _txHash?: `0x${string}`;

    constructor(
        public readonly descriptor: ApproveDescriptor,
        private readonly ctx: TaskContext,
    ) {}

    static create(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        spender: `0x${string}`,
        ctx: TaskContext,
    ): ApproveTask {
        const desc: ApproveDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.APPROVE,
            chainId,
            mint,
            amount,
            spender,
        };
        return new ApproveTask(desc, ctx);
    }

    name() {
        return "Approve";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === ApproveState.Completed;
    }

    async step(): Promise<void> {
        const { chainId, mint, amount, spender } = this.descriptor;
        const pc = this.ctx.getPublicClient(chainId);

        switch (this._state) {
            case ApproveState.Pending: {
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

                const txHash = await writeContract(this.ctx.wagmiConfig, request);
                this._txHash = txHash;
                this._state = ApproveState.Submitted;
                break;
            }
            case ApproveState.Submitted: {
                if (!this._txHash) throw new ApproveError("Missing txHash", false);
                await pc.waitForTransactionReceipt({ hash: this._txHash });
                this._state = ApproveState.Completed;
                break;
            }
            default:
                throw new ApproveError("step() called after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Determine if *this specific instance* of ApproveTask should stay in the plan.
     * Falls back to `true` on any unexpected error to be conservative.
     */
    async isNeeded(): Promise<boolean> {
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
            console.log("approve allowance", {
                spender,
                mint,
                amount,
                allowance,
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
    static fromCoreTask(
        task: import("../planner/task-planner").PlannedTask,
        ctx: TaskContext,
    ): ApproveTask | undefined {
        switch (task.descriptor.type) {
            case TASK_TYPES.DEPOSIT: {
                const dep = task as import("./deposit-task").DepositTask;
                const { chainId, mint, amount } = dep.descriptor;
                // Use a large allowance to avoid insufficiency later.
                // const maxUint256 = (BigInt(1) << BigInt(256)) - BigInt(1);
                const spender = getSDKConfig(chainId).permit2Address as `0x${string}`;
                return ApproveTask.create(chainId, mint, amount, spender, ctx);
            }
            case TASK_TYPES.LIFI_LEG: {
                const legTask = task as import("./lifi-leg-task").LiFiLegTask;
                const { chainId, mint, amount } = legTask;
                if (chainId === solana.id) return undefined;
                if (mint === zeroAddress) return undefined; // native ETH
                const spender = legTask.descriptor.leg.estimate?.approvalAddress as
                    | `0x${string}`
                    | undefined;
                if (!spender) return undefined;
                return ApproveTask.create(chainId, mint, amount, spender, ctx);
            }
            default:
                return undefined;
        }
    }
}
