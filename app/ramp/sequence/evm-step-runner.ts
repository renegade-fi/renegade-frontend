import type { TxStep } from "./models";

export class EvmStepRunner {
    /**
     * When set to true, the next call to `run` will return a FAILED step.
     * The flag resets to false immediately afterwards. purely for sandbox testing.
     */
    public shouldFailNext = false;

    async run(step: TxStep): Promise<TxStep> {
        // Failure simulation for sandbox debugging
        if (this.shouldFailNext) {
            this.shouldFailNext = false;
            return {
                ...step,
                status: "FAILED",
            };
        }

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
