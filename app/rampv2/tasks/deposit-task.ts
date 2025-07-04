import { deposit } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";
import { waitForRenegadeTask } from "./helpers/waiters";

export interface DepositDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
}

export enum DepositState {
    Pending,
    Submitted,
    Completed,
}

class DepositError extends Error implements BaseTaskError {
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

export class DepositTask extends Task<DepositDescriptor, DepositState, DepositError> {
    private _state: DepositState = DepositState.Pending;
    private _taskId?: string;
    private _finalAmount: bigint;

    constructor(
        public readonly descriptor: DepositDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
        this._finalAmount = descriptor.amount;
    }

    static create(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        ctx: TaskContext,
    ): DepositTask {
        const desc: DepositDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.DEPOSIT,
            chainId,
            mint,
            amount,
        };
        return new DepositTask(desc, ctx);
    }

    name() {
        return "Deposit";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === DepositState.Completed;
    }

    async step(): Promise<void> {
        const { chainId, mint } = this.descriptor;

        switch (this._state) {
            case DepositState.Pending: {
                this._finalAmount = this.ctx.getExpectedBalance(chainId, mint);
                console.log("deposit task", {
                    chainId,
                    mint,
                    finalAmount: this._finalAmount,
                });

                await ensureCorrectChain(this.ctx, chainId);

                if (
                    !this.ctx.permit?.nonce ||
                    !this.ctx.permit?.deadline ||
                    !this.ctx.permit?.signature
                ) {
                    throw new DepositError("Permit is not set", false);
                }

                const token = resolveAddress(mint);
                const owner = this.ctx.getOnchainAddress(chainId) as `0x${string}`;

                const { taskId } = await deposit(this.ctx.renegadeConfig, {
                    fromAddr: owner,
                    mint: token.address,
                    amount: this._finalAmount,
                    permitNonce: this.ctx.permit.nonce,
                    permitDeadline: this.ctx.permit.deadline,
                    permit: this.ctx.permit.signature,
                });

                this._taskId = taskId;
                this._state = DepositState.Submitted;
                break;
            }
            case DepositState.Submitted: {
                if (!this._taskId) throw new DepositError("No taskId", false);
                await waitForRenegadeTask(this.ctx.renegadeConfig, this._taskId);
                this._state = DepositState.Completed;
                break;
            }
            default:
                throw new DepositError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
