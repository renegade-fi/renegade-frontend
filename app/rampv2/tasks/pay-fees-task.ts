import { getBackOfQueueWallet, payFees } from "@renegade-fi/react/actions";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { waitForRenegadeTask } from "./helpers/waiters";

interface PayFeesDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
}

type PayFeesState = "Pending" | "Loading" | "Completed";

class PayFeesError extends Error implements BaseTaskError {
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

export class PayFeesTask extends Task<PayFeesDescriptor, PayFeesState, PayFeesError> {
    private _state: PayFeesState = "Pending";
    private _taskId?: string;

    constructor(
        public readonly descriptor: PayFeesDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
    }

    static create(chainId: number, ctx: TaskContext): PayFeesTask {
        const desc: PayFeesDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.PAY_FEES,
            chainId,
        };
        return new PayFeesTask(desc, ctx);
    }

    name() {
        return "Prepare withdraw";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    /**
     * Decide whether this PayFeesTask should be kept in the plan.
     */
    async isNeeded(_ctx: TaskContext): Promise<boolean> {
        try {
            const wallet = await getBackOfQueueWallet(this.ctx.renegadeConfig);
            return wallet.balances.some(
                (b) => b.protocol_fee_balance > BigInt(0) || b.relayer_fee_balance > BigInt(0),
            );
        } catch {
            return true; // be conservative
        }
    }

    async step(): Promise<void> {
        switch (this._state) {
            case "Pending": {
                this._state = "Loading";
                break;
            }
            case "Loading": {
                const result = await payFees(this.ctx.renegadeConfig);
                const lastTaskIdx = result.taskIds.length - 1;
                const taskId: string | undefined = result.taskIds[lastTaskIdx];
                if (!taskId) {
                    throw new PayFeesError("No taskId", false);
                } else {
                    this._taskId = taskId;
                    try {
                        await waitForRenegadeTask(this.ctx.renegadeConfig, this._taskId);
                    } catch (e) {
                        console.error("Error in PayFeesTask", e);
                        throw new PayFeesError("Failed to pay fees", false);
                    }
                    this._state = "Completed";
                }
                break;
            }
            default:
                throw new PayFeesError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
