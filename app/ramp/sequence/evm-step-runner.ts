import type { TxStep } from "./models";

export class EvmStepRunner {
    async run(step: TxStep): Promise<TxStep> {
        // TODO: integrate wagmi/viem wallet interaction per step.type
        // For sandbox, we instantly mark as confirmed.
        const confirmed: TxStep = {
            ...step,
            status: "CONFIRMED",
            txHash: "0xdeadbeef" as `0x${string}`,
        };
        return confirmed;
    }
}
