import { writeContract } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { USDT_MAINNET_ADDRESS, usdtAbi } from "@/lib/usdtAbi";
import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * ERC20 token approval step.
 *
 * Handles setting token allowances for spender contracts before transfers.
 */
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

        const owner = ctx.getWagmiAddress();
        if (!owner) throw new Error("Wallet account not found");

        // 1. Check current allowance.
        const pc = ctx.getPublicClient(this.chainId);
        const allowance = await pc.readContract({
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
        // Mainnet USDT omits the bool return value, so switch to the
        // special-case ABI when interacting with it. All other tokens
        // continue to use the standard ERC-20 ABI.
        const isUsdt = this.chainId === 1 && this.mint.toLowerCase() === USDT_MAINNET_ADDRESS;

        const abiOverride = isUsdt ? usdtAbi : erc20Abi;

        const { request } = await pc.simulateContract({
            abi: abiOverride,
            address: this.mint,
            functionName: "approve",
            args: [this.spender, this.amount],
            account: owner,
        });

        const wagmiConfig = ctx.wagmiConfig;
        const txHash = await writeContract(wagmiConfig, request);
        await pc.waitForTransactionReceipt({ hash: txHash });

        this.status = "CONFIRMED";
        this.txHash = txHash;
    }

    override toJSON(): Record<string, unknown> {
        return { ...super.toJSON(), spender: this.spender };
    }
}
