import type { StepExecutionContext } from "../models";
import { BaseStep } from "../models";

export class BridgeTxStep extends BaseStep {
    constructor(chainId: number, mint: `0x${string}`, amount: bigint) {
        super(crypto.randomUUID(), "BRIDGE", chainId, mint, amount);
    }

    async run(_ctx: StepExecutionContext): Promise<void> {
        // TODO: implement real bridge logic (e.g., hop, layerzero, etc.)
        console.warn("BridgeTxStep.run() not implemented; marking confirmed for now");
        this.status = "CONFIRMED";
    }
}
