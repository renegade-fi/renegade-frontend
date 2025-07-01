import { erc20Abi } from "@/lib/generated";
import type { StepExecutionContext } from "../models";
import { BaseStep } from "../models";

export class ApproveStep extends BaseStep {
    constructor(
        chainId: number,
        mint: `0x${string}`,
        amount: bigint,
        private readonly spender: `0x${string}`,
    ) {
        super(crypto.randomUUID(), "APPROVE", chainId, mint, amount);
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);

        const owner = ctx.walletClient.account?.address;
        if (!owner) throw new Error("Wallet account not found");

        // 1. Check current allowance.
        const allowance = await ctx.publicClient.readContract({
            abi: erc20Abi,
            address: this.mint,
            functionName: "allowance",
            args: [owner, this.spender],
        });

        if (allowance >= this.amount) {
            this.status = "CONFIRMED";
            return; // nothing to do
        }

        // 2. Approve
        const { request } = await ctx.publicClient.simulateContract({
            abi: erc20Abi,
            address: this.mint,
            functionName: "approve",
            args: [this.spender, this.amount],
            account: owner,
        });

        const txHash = await ctx.walletClient.writeContract(request);
        await ctx.publicClient.waitForTransactionReceipt({ hash: txHash });

        this.status = "CONFIRMED";
        this.txHash = txHash;
    }

    override toJSON(): Record<string, unknown> {
        return { ...super.toJSON(), spender: this.spender };
    }
}
