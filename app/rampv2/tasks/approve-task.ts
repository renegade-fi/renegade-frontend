import { writeContract } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { USDT_MAINNET_ADDRESS, usdtAbi } from "@/lib/usdtAbi";
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

    /**
     * Determine at runtime whether an approval transaction is actually required.
     * Mirrors the logic from the v1 `ApproveStep` implementation.
     */
    static async isNeeded(
        ctx: TaskContext,
        chainId: number,
        mint: `0x${string}`,
        spender: `0x${string}`,
        amount: bigint,
    ): Promise<boolean> {
        try {
            const pc = ctx.getPublicClient(chainId);
            const owner = ctx.getOnchainAddress(chainId) as `0x${string}`;
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
}
