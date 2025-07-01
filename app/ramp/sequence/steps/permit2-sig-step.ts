import { getSDKConfig } from "@renegade-fi/react";
import { getPkRootScalars } from "@renegade-fi/react/actions";
import { signPermit2 } from "@/lib/permit2";
import { resolveAddress } from "@/lib/token";
import type { StepExecutionContext } from "../models";
import { BaseStep } from "../models";

export class Permit2SigStep extends BaseStep {
    public signature?: `0x${string}`;
    public nonce?: bigint;
    public deadline?: bigint;

    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "PERMIT2_SIG", chainId, mint, amount);
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);
        const sdkCfg = getSDKConfig(this.chainId);
        const token = resolveAddress(this.mint);
        const pkRoot = getPkRootScalars(ctx.renegadeConfig, { nonce: ctx.keychainNonce });
        const wallet = await ctx.getWalletClient(this.chainId);
        const { signature, nonce, deadline } = await signPermit2({
            amount: this.amount,
            chainId: this.chainId,
            spender: sdkCfg.darkpoolAddress,
            permit2Address: sdkCfg.permit2Address,
            token,
            walletClient: wallet,
            pkRoot,
        } as any);
        this.signature = signature;
        this.nonce = nonce;
        this.deadline = deadline;

        // Persist in execution context for downstream steps
        ctx.permit = { signature, nonce, deadline };

        this.status = "CONFIRMED";
    }
}
