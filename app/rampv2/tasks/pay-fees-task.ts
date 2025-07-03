import { getBackOfQueueWallet, payFees } from "@renegade-fi/react/actions";
import type { TaskError as BaseTaskError, Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { waitForRenegadeTask } from "./helpers/waiters";

export interface PayFeesDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
}

export enum PayFeesState {
    Pending,
    Submitted,
    Completed,
}

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

export class PayFeesTask implements Task<PayFeesDescriptor, PayFeesState, PayFeesError> {
    private _state: PayFeesState = PayFeesState.Pending;
    private _taskId?: string;

    constructor(
        public readonly descriptor: PayFeesDescriptor,
        private readonly ctx: TaskContext,
    ) {}

    static async isNeeded(ctx: TaskContext): Promise<boolean> {
        try {
            const wallet = await getBackOfQueueWallet(ctx.renegadeConfig);
            return wallet.balances.some(
                (b) => b.protocol_fee_balance > BigInt(0) || b.relayer_fee_balance > BigInt(0),
            );
        } catch {
            return true; // be conservative
        }
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
        return "PayFees";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === PayFeesState.Completed;
    }

    async step(): Promise<void> {
        switch (this._state) {
            case PayFeesState.Pending: {
                const result = await payFees(this.ctx.renegadeConfig);
                const taskId: string | undefined = (result as any)?.taskId;
                if (!taskId) {
                    this._state = PayFeesState.Completed;
                } else {
                    this._taskId = taskId;
                    this._state = PayFeesState.Submitted;
                }
                break;
            }
            case PayFeesState.Submitted: {
                if (!this._taskId) throw new PayFeesError("No taskId", false);
                await waitForRenegadeTask(this.ctx.renegadeConfig, this._taskId);
                this._state = PayFeesState.Completed;
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
