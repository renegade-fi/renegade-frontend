import type { StepExecutionContext } from "../models";
import { BaseStep } from "../models";

export class ChainSwitchStep extends BaseStep {
    constructor(chainId: number) {
        super(
            crypto.randomUUID(),
            "BRIDGE",
            chainId,
            "0x0000000000000000000000000000000000000000",
            BigInt(0),
        );
        // Using type "BRIDGE" just as placeholder for UI; adjust if a new type is added.
        this.type = "BRIDGE";
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        // If already on desired chain, mark confirmed.
        if (ctx.walletClient.chain?.id === this.chainId) {
            this.status = "CONFIRMED";
            return;
        }

        await ctx.walletClient.switchChain({ id: this.chainId });
        this.status = "CONFIRMED";
    }
}
