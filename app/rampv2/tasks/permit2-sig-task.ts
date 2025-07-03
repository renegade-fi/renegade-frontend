import { getSDKConfig } from "@renegade-fi/react";
import { getPkRootScalars } from "@renegade-fi/react/actions";
import { signTypedData } from "wagmi/actions";
import { constructPermit2SigningData } from "@/app/rampv2/tasks/helpers/permit2-helpers";
import { resolveAddress } from "@/lib/token";
import type { TaskError as BaseTaskError, Task } from "../core/task";
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

export enum PermitSigState {
    Pending,
    Completed,
}

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

export class Permit2SigTask implements Task<PermitSigDescriptor, PermitSigState, PermitSigError> {
    private _state: PermitSigState = PermitSigState.Pending;

    constructor(
        public readonly descriptor: PermitSigDescriptor,
        private readonly ctx: TaskContext,
    ) {}

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
        return "Permit2Sig";
    }

    state() {
        return this._state;
    }

    completed() {
        return this._state === PermitSigState.Completed;
    }

    async step(): Promise<void> {
        if (this._state !== PermitSigState.Pending)
            throw new PermitSigError("Already completed", false);

        const { chainId, mint, amount } = this.descriptor;
        await ensureCorrectChain(this.ctx, chainId);

        const finalAmount = this.ctx.data.lifiFinalAmount ?? amount;

        const sdkCfg = getSDKConfig(chainId);
        const token = resolveAddress(mint);
        const pkRoot = getPkRootScalars(this.ctx.renegadeConfig, { nonce: this.ctx.keychainNonce });

        const { domain, message, types, primaryType } = constructPermit2SigningData({
            chainId,
            permit2Address: sdkCfg.permit2Address,
            tokenAddress: token.address,
            amount: finalAmount,
            spender: sdkCfg.darkpoolAddress,
            pkRoot: pkRoot as unknown as readonly [bigint, bigint, bigint, bigint],
        });

        const signature = await signTypedData(this.ctx.wagmiConfig, {
            domain,
            types,
            primaryType,
            message,
        });

        this.ctx.permit = { signature, nonce: message.nonce, deadline: message.deadline };

        this._state = PermitSigState.Completed;
    }

    cleanup(): Promise<void> {
        return Promise.resolve();
    }
}
