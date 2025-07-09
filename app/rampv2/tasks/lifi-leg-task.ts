import type { ExtendedTransactionInfo, Route, SDKError } from "@lifi/sdk";
import { getStepTransaction, LiFiErrorCode } from "@lifi/sdk";
import { sendTransaction } from "wagmi/actions";
import { extractSupportedChain, getExplorerLink, solana } from "@/lib/viem";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { isETH } from "../helpers";
import { getTokenByAddress } from "../token-registry";
import { ensureCorrectChain } from "./helpers/evm-utils";
import { sendSolanaTransaction } from "./helpers/solana";
import { waitForLiFiStatus } from "./helpers/waiters";

interface LiFiLegDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly leg: Route["steps"][number];
    readonly isFinalLeg: boolean;
}

type LiFiLegState = "Pending" | "AwaitingWallet" | "Submitted" | "Confirming" | "Completed";

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

export class LiFiLegTask extends Task<LiFiLegDescriptor, LiFiLegState, LiFiLegError> {
    private _state: LiFiLegState = "Pending";
    private _txRequest?: any;
    private _txHash?: string;

    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;

    constructor(
        public readonly descriptor: LiFiLegDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
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
        const fromTicker = this.getTokenTicker(
            this.descriptor.leg.action.fromToken.address,
            this.descriptor.leg.action.fromChainId,
        );
        const toTicker = this.getTokenTicker(
            this.descriptor.leg.action.toToken.address,
            this.descriptor.leg.action.toChainId,
        );

        if (this.isWrapOperation()) {
            return this.formatWrapName(fromTicker, toTicker);
        }

        if (this.isBridgeOperation()) {
            return this.formatBridgeName(fromTicker, toTicker);
        }
        return this.formatSwapName(fromTicker, toTicker);
    }

    private getTokenTicker(address: string, chainId: number): string | undefined {
        return getTokenByAddress(address, chainId)?.ticker;
    }

    private getChainName(chainId: number): string | undefined {
        return extractSupportedChain(chainId)?.name;
    }

    public isWrapOperation(): boolean {
        const { fromToken, toToken, fromChainId, toChainId } = this.descriptor.leg.action;

        // Only check for wrap/unwrap on same chain
        if (fromChainId !== toChainId) return false;

        const isFromEth = isETH(fromToken.address, fromChainId);
        const isToEth = isETH(toToken.address, toChainId);

        // Either wrapping ETH or unwrapping to ETH
        return isFromEth || isToEth;
    }

    public isSwapOperation(): boolean {
        return (
            this.descriptor.leg.action.fromToken.address !==
            this.descriptor.leg.action.toToken.address
        );
    }

    public isBridgeOperation(): boolean {
        return this.descriptor.leg.action.fromChainId !== this.descriptor.leg.action.toChainId;
    }

    private formatWrapName(fromTicker?: string, toTicker?: string): string {
        const { fromToken, fromChainId } = this.descriptor.leg.action;

        if (isETH(fromToken.address, fromChainId)) {
            return `Wrap ${fromTicker}`;
        }
        return `Unwrap ${fromTicker}`;
    }

    private formatBridgeName(fromTicker?: string, toTicker?: string): string {
        const fromChain = this.getChainName(this.descriptor.leg.action.fromChainId);
        const toChain = this.getChainName(this.descriptor.leg.action.toChainId);
        return `Bridge ${fromTicker} from ${fromChain} to ${toChain}`;
    }

    private formatSwapName(fromTicker?: string, toTicker?: string): string {
        return `Swap ${fromTicker} to ${toTicker}`;
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    async step(): Promise<void> {
        switch (this._state) {
            case "Pending": {
                const { leg } = this.descriptor;
                // Do not attempt wagmi chain switch for Solana legs – different connector.
                if (this.chainId !== solana.id) {
                    await ensureCorrectChain(this.ctx, this.chainId);
                }
                try {
                    const populated = await getStepTransaction(leg);
                    const txRequest = populated?.transactionRequest;
                    if (!txRequest) throw new LiFiLegError("Missing transaction request", false);
                    this._txRequest = txRequest;
                } catch (e) {
                    const err = e as SDKError;
                    console.error("Error in LiFiLegTask", err);
                    switch (err.code) {
                        case LiFiErrorCode.SlippageError:
                            throw new LiFiLegError("Slippage exceeded", false);
                        default:
                            throw new LiFiLegError("Couldn't get transaction data", false);
                    }
                }
                this._state = "AwaitingWallet";
                break;
            }
            case "AwaitingWallet": {
                if (!this._txRequest) throw new LiFiLegError("Missing tx request", false);

                try {
                    if (
                        this.chainId === solana.id &&
                        this.ctx.connection &&
                        this.ctx.signTransaction
                    ) {
                        const signature = await sendSolanaTransaction(
                            this._txRequest,
                            this.ctx.connection,
                            this.ctx.signTransaction,
                        );
                        this._txHash = signature;
                    } else {
                        const txHash = await sendTransaction(this.ctx.wagmiConfig, {
                            ...this._txRequest,
                            type: "legacy",
                        } as any);
                        this._txHash = txHash as string;
                    }
                    this._state = "Submitted";
                } catch (e) {
                    console.error("Error in LiFiLegTask", e);
                    throw new LiFiLegError("Failed to send transaction", false);
                }
                break;
            }
            case "Submitted": {
                if (!this._txHash) throw new LiFiLegError("No tx hash", false);
                const status = await waitForLiFiStatus({
                    txHash: this._txHash,
                    fromChain: this.chainId,
                    toChain: this.descriptor.leg.action.toChainId,
                });
                if (status.status !== "DONE")
                    throw new LiFiLegError(`LiFi status ${status.status}`, true);
                if (this.descriptor.isFinalLeg && "receiving" in status) {
                    const amtStr = (status.receiving as ExtendedTransactionInfo).amount ?? "0";
                    const toChainId = this.descriptor.leg.action.toChainId;
                    const toTokenAddress = this.descriptor.leg.action.toToken
                        .address as `0x${string}`;
                    this.ctx.routeOutput(toChainId, toTokenAddress, BigInt(amtStr));
                }
                this._state = "Completed";
                break;
            }
            default:
                throw new LiFiLegError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }

    explorerLink(): string | undefined {
        if (!this._txHash) return undefined;
        return getExplorerLink(this._txHash as string, this.chainId);
    }
}
