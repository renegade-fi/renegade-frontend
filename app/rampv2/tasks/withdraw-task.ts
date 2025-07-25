import { withdraw } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";
import { waitForRenegadeTask } from "./helpers/waiters";

interface WithdrawDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
}

type WithdrawState = "Pending" | "Submitted" | "Completed";

class WithdrawError extends Error implements BaseTaskError {
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

export class WithdrawTask extends Task<WithdrawDescriptor, WithdrawState, WithdrawError> {
    private _state: WithdrawState = "Pending";
    private _taskId?: string;

    constructor(
        public readonly descriptor: WithdrawDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
    }

    static create(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        ctx: TaskContext,
    ): WithdrawTask {
        const desc: WithdrawDescriptor = {
            amount,
            chainId,
            id: crypto.randomUUID(),
            mint,
            type: TASK_TYPES.WITHDRAW,
        };
        return new WithdrawTask(desc, ctx);
    }

    name() {
        const ticker = resolveAddress(this.descriptor.mint).ticker;
        return ticker && ticker !== "UNKNOWN" ? `Withdraw ${ticker}` : "Withdraw";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    async step(): Promise<void> {
        const { chainId, mint, amount } = this.descriptor;
        switch (this._state) {
            case "Pending": {
                await ensureCorrectChain(this.ctx, chainId);
                const owner = this.ctx.getOnchainAddress(chainId) as `0x${string}`;
                const token = resolveAddress(mint);
                const { taskId } = await withdraw(this.ctx.renegadeConfig, {
                    amount,
                    destinationAddr: owner,
                    mint: token.address,
                });
                this._taskId = taskId;
                this._state = "Submitted";
                break;
            }
            case "Submitted": {
                if (!this._taskId) throw new WithdrawError("No taskId", false);
                try {
                    await waitForRenegadeTask(this.ctx.renegadeConfig, this._taskId);
                } catch (e) {
                    console.error("Error in WithdrawTask", e);
                    throw new WithdrawError("Failed to withdraw", false);
                }
                this._state = "Completed";
                break;
            }
            default:
                throw new WithdrawError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
