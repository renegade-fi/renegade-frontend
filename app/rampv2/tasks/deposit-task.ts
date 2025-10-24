import { deposit } from "@renegade-fi/react/actions";
import { resolveAddress } from "@/lib/token";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";
import { waitForRenegadeTask } from "./helpers/waiters";

interface DepositDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
}

type DepositState = "Pending" | "Submitted" | "Completed";

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
    private _state: DepositState = "Pending";
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
            amount,
            chainId,
            id: crypto.randomUUID(),
            mint,
            type: TASK_TYPES.DEPOSIT,
        };
        return new DepositTask(desc, ctx);
    }

    name() {
        const ticker = resolveAddress(this.descriptor.mint).ticker;
        return ticker && ticker !== "UNKNOWN" ? `Deposit ${ticker}` : "Deposit";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    async step(): Promise<void> {
        const { chainId, mint } = this.descriptor;

        switch (this._state) {
            case "Pending": {
                this._finalAmount = this.ctx.getDepositAmount(
                    chainId,
                    mint,
                    this.descriptor.amount,
                );

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
                    amount: this._finalAmount,
                    fromAddr: owner,
                    mint: token.address,
                    permit: this.ctx.permit.signature,
                    permitDeadline: this.ctx.permit.deadline,
                    permitNonce: this.ctx.permit.nonce,
                });

                this._taskId = taskId;
                this._state = "Submitted";
                break;
            }
            case "Submitted": {
                if (!this._taskId) throw new DepositError("No taskId", false);
                try {
                    await waitForRenegadeTask(this.ctx.renegadeConfig, this._taskId);
                } catch (e) {
                    console.error("Error in DepositTask", e);
                    throw new DepositError("Failed to deposit", false);
                }
                this._state = "Completed";
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
