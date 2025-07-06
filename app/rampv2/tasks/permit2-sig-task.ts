import { getSDKConfig } from "@renegade-fi/react";
import { getPkRootScalars } from "@renegade-fi/react/actions";
import { signTypedData } from "wagmi/actions";
import { constructPermit2SigningData } from "@/app/rampv2/tasks/helpers/permit2-helpers";
import { resolveAddress } from "@/lib/token";
import type { TaskError as BaseTaskError } from "../core/task";
import { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ensureCorrectChain } from "./helpers/evm-utils";

export interface PermitSigDescriptor {
    readonly id: string;
    readonly type: TaskType;
    readonly chainId: number;
    readonly mint: `0x${string}`;
    readonly amount: bigint;
}

export type PermitSigState = "Pending" | "AwaitingWallet" | "Completed";

class PermitSigError extends Error implements BaseTaskError {
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

export class Permit2SigTask extends Task<PermitSigDescriptor, PermitSigState, PermitSigError> {
    private _state: PermitSigState = "Pending";
    private _signingData?: {
        domain: any;
        types: any;
        primaryType: string;
        message: any;
    };

    constructor(
        public readonly descriptor: PermitSigDescriptor,
        private readonly ctx: TaskContext,
    ) {
        super();
    }

    static create(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        ctx: TaskContext,
    ): Permit2SigTask {
        const desc: PermitSigDescriptor = {
            id: crypto.randomUUID(),
            type: TASK_TYPES.PERMIT2_SIG,
            chainId,
            mint,
            amount,
        };
        return new Permit2SigTask(desc, ctx);
    }

    name() {
        return "Sign Permit2";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === "Completed";
    }

    /** Permit2 signature is always required once present in the plan. */
    async isNeeded(_ctx: TaskContext): Promise<boolean> {
        return true;
    }

    async step(): Promise<void> {
        switch (this._state) {
            case "Pending": {
                const { chainId, mint } = this.descriptor;
                await ensureCorrectChain(this.ctx, chainId);

                const finalAmount = this.ctx.getExpectedBalance(chainId, mint);

                const sdkCfg = getSDKConfig(chainId);
                const token = resolveAddress(mint);
                const pkRoot = getPkRootScalars(this.ctx.renegadeConfig, {
                    nonce: this.ctx.keychainNonce,
                });

                const { domain, message, types, primaryType } = constructPermit2SigningData({
                    chainId,
                    permit2Address: sdkCfg.permit2Address,
                    tokenAddress: token.address,
                    amount: finalAmount,
                    spender: sdkCfg.darkpoolAddress,
                    pkRoot: pkRoot as unknown as readonly [bigint, bigint, bigint, bigint],
                });

                this._signingData = { domain, message, types, primaryType } as any;
                this._state = "AwaitingWallet";
                break;
            }
            case "AwaitingWallet": {
                if (!this._signingData) throw new PermitSigError("Missing signing data", false);

                const signature = await signTypedData(
                    this.ctx.wagmiConfig,
                    this._signingData as any,
                );

                this.ctx.permit = {
                    signature,
                    nonce: (this._signingData as any).message.nonce,
                    deadline: (this._signingData as any).message.deadline,
                };

                this._state = "Completed";
                break;
            }
            default:
                throw new PermitSigError("step() after completion", false);
        }
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
