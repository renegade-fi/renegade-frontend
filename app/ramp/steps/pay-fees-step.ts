import { getBackOfQueueWallet, payFees } from "@renegade-fi/react/actions";
import { zeroAddress } from "@/lib/token";
import type { SequenceIntent, StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * Renegade fee payment step.
 *
 * Executes payFees() to cover Renegade network fees.
 */
export class PayFeesStep extends BaseStep {
    // No further prerequisites; acts as one itself
    static override prereqs = [];

    /**
     * Decide if fee payment is required for the current context.
     */
    override async isNeeded(ctx: StepExecutionContext, _intent?: SequenceIntent): Promise<boolean> {
        try {
            const wallet = await getBackOfQueueWallet(ctx.renegadeConfig);
            return wallet.balances.some(
                (b) => b.protocol_fee_balance > BigInt(0) || b.relayer_fee_balance > BigInt(0),
            );
        } catch {
            // If fetching fails, be conservative and assume fees exist
            return true;
        }
    }

    constructor(chainId: number) {
        // Uses zero address + 0 amount placeholders; not displayed to user
        super(crypto.randomUUID(), "PAY_FEES", chainId, zeroAddress as `0x${string}`, BigInt(0));
    }

    /** No token amount to display for fee payment. */
    override get details(): string {
        return "";
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);
        await payFees(ctx.renegadeConfig);
        this.status = "CONFIRMED";
    }
}
