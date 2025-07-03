import type { ExtendedTransactionInfo, Route } from "@lifi/sdk";
import { getStepTransaction } from "@lifi/sdk";
import { sendTransaction } from "wagmi/actions";
import { zeroAddress } from "@/lib/token";
import { solana } from "@/lib/viem";
import type { TaskError as BaseTaskError, Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";
import { awaitSolanaConfirmation, sendSolanaTransaction } from "./helpers/solana";
import { waitForLiFiStatus, waitForTxReceipt } from "./helpers/waiters";

export interface LiFiLegDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly leg: Route["steps"][number];
    readonly isFinalLeg: boolean;
}

export enum LiFiLegState {
    Pending,
    Submitted,
    Confirming,
    Completed,
}

class LiFiLegError extends Error implements BaseTaskError {
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

export class LiFiLegTask implements Task<LiFiLegDescriptor, LiFiLegState, LiFiLegError> {
    private _state: LiFiLegState = LiFiLegState.Pending;
    private _txHash?: string;

    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;

    constructor(
        public readonly descriptor: LiFiLegDescriptor,
        private readonly ctx: TaskContext,
    ) {
        this.chainId = descriptor.leg.action.fromChainId;
        this.mint = descriptor.leg.action.fromToken.address as `0x${string}`;
        this.amount = BigInt(descriptor.leg.action.fromAmount);
    }

    static create(leg: Route["steps"][number], isFinalLeg: boolean, ctx: TaskContext): LiFiLegTask {
        const desc: LiFiLegDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.LIFI_LEG,
            leg,
            isFinalLeg,
        };
        return new LiFiLegTask(desc, ctx);
    }

    name() {
        return "LiFiLeg";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === LiFiLegState.Completed;
    }

    /**
     * Return spender/amount for allowances required before executing this leg.
     * If the LI.FI API does not indicate an approval address, no approval is
     * required.
     */
    approvalRequirement() {
        // Solana SPL tokens (or native SOL) do not use ERC-20 style approvals.
        if (this.chainId === solana.id) return undefined;
        // Native ETH does not require approval.
        if (this.mint === zeroAddress) return undefined;
        console.log("approvalRequirement", { mint: this.mint, zeroAddress });
        const approvalAddr = this.descriptor.leg.estimate?.approvalAddress as
            | `0x${string}`
            | undefined;
        if (!approvalAddr) return undefined;
        const amount = BigInt(this.descriptor.leg.action.fromAmount);
        return { spender: approvalAddr, amount } as const;
    }

    async step(): Promise<void> {
        switch (this._state) {
            case LiFiLegState.Pending: {
                const { leg } = this.descriptor;
                // Do not attempt wagmi chain switch for Solana legs – different connector.
                if (this.chainId !== solana.id) {
                    await ensureCorrectChain(this.ctx, this.chainId);
                }
                const populated = await getStepTransaction(leg);
                const txRequest: any = populated?.transactionRequest;
                if (!txRequest) throw new LiFiLegError("Missing transaction request", false);

                if (this.chainId === solana.id && this.ctx.connection && this.ctx.signTransaction) {
                    const signature = await sendSolanaTransaction(
                        txRequest,
                        this.ctx.connection,
                        this.ctx.signTransaction,
                    );
                    this._txHash = signature;
                    this._state = LiFiLegState.Submitted;
                } else {
                    const txHash = await sendTransaction(this.ctx.wagmiConfig, {
                        ...txRequest,
                        type: "legacy",
                    } as any);
                    this._txHash = txHash as string;
                    this._state = LiFiLegState.Submitted;
                }
                break;
            }
            case LiFiLegState.Submitted: {
                if (!this._txHash) throw new LiFiLegError("No tx hash", false);
                if (this.chainId === solana.id && this.ctx.connection) {
                    await awaitSolanaConfirmation(this._txHash, this.ctx.connection);
                    this._state = LiFiLegState.Completed;
                } else {
                    await waitForTxReceipt(this.ctx.getPublicClient(this.chainId), this._txHash);
                    this._state = LiFiLegState.Confirming;
                }
                break;
            }
            case LiFiLegState.Confirming: {
                if (!this._txHash) throw new LiFiLegError("No tx hash", false);
                const status = await waitForLiFiStatus(this._txHash);
                if (status.status !== "DONE")
                    throw new LiFiLegError(`LiFi status ${status.status}`, true);
                // capture final amount
                if (this.descriptor.isFinalLeg && "receiving" in status) {
                    const amtStr = (status.receiving as ExtendedTransactionInfo).amount ?? "0";
                    this.ctx.data.lifiFinalAmount = BigInt(amtStr);
                }
                this._state = LiFiLegState.Completed;
                break;
            }
            default:
                throw new LiFiLegError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
