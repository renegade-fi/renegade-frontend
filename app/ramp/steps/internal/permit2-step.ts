import { getSDKConfig } from "@renegade-fi/react";
import { getPkRootScalars } from "@renegade-fi/react/actions";
import { signTypedData } from "wagmi/actions";
import { resolveAddress } from "@/lib/token";
import type { StepExecutionContext } from "../../types";
import { BaseStep } from "../base-step";
import { constructPermit2SigningData } from "./permit2-helpers";

/**
 * @internal
 * Permit2 signature step for Renegade deposits.
 *
 * Generates EIP-712 typed data signature for gasless token transfers.
 */
export class Permit2Step extends BaseStep {
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

        // Construct signing data
        const { domain, message, types, primaryType } = constructPermit2SigningData({
            chainId: this.chainId,
            permit2Address: sdkCfg.permit2Address,
            tokenAddress: token.address,
            amount: this.amount,
            spender: sdkCfg.darkpoolAddress,
            pkRoot: pkRoot as unknown as readonly [bigint, bigint, bigint, bigint],
        });

        // Generate signature
        const signature = await signTypedData(ctx.wagmiConfig, {
            domain,
            types,
            primaryType,
            message,
        });

        this.signature = signature;
        this.nonce = message.nonce;
        this.deadline = message.deadline;

        // Persist in execution context for downstream steps
        ctx.permit = { signature, nonce: message.nonce, deadline: message.deadline };

        this.status = "CONFIRMED";
    }
}
