import { getStepTransaction, type Route } from "@lifi/sdk";
import { sendTransaction } from "wagmi/actions";
import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";
import { requestBestRoute } from "./internal/lifi";

// Error messages
const WALLET_NOT_CONNECTED = "SwapStep: wallet not connected";
const NO_STEPS_IN_ROUTE = "SwapStep: no steps in LI.FI route";
const MISSING_TX_REQUEST = "SwapStep: route missing transaction request";

/**
 * On-chain token swap step using LI.FI protocol.
 *
 * Executes token swaps on the same or different chains.
 */
export class SwapStep extends BaseStep {
    private readonly dstChain: number;
    private readonly toMint: `0x${string}`;
    private route?: Route;

    constructor(
        fromChain: number,
        toChain: number,
        fromMint: `0x${string}`,
        toMint: `0x${string}`,
        amount: bigint,
        route?: Route,
    ) {
        super(crypto.randomUUID(), "SWAP", fromChain, fromMint, amount);
        this.dstChain = toChain;
        this.toMint = toMint;
        this.route = route;
    }

    override async approvalRequirement(ctx: StepExecutionContext) {
        if (!this.route) {
            const owner = ctx.getWagmiAddress();
            if (!owner) throw new Error(WALLET_NOT_CONNECTED);

            this.route = await requestBestRoute({
                fromChainId: this.chainId,
                toChainId: this.dstChain,
                fromTokenAddress: this.mint,
                toTokenAddress: this.toMint,
                fromAmount: this.amount.toString(),
                fromAddress: owner,
            });
        }

        const firstStep = this.route?.steps?.[0];
        if (!firstStep) return undefined;

        const approvalAddress: `0x${string}` | undefined = firstStep?.estimate
            ?.approvalAddress as `0x${string}`;
        const approvalAmountRaw = firstStep.action.fromAmount;
        const approvalAmount: bigint = BigInt(approvalAmountRaw);

        console.log("step approve debug", {
            approvalAddress,
            approvalAmount,
            amount: this.amount,
            mint: this.mint,
        });
        return approvalAddress ? { spender: approvalAddress, amount: approvalAmount } : undefined;
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        // Ensure wallet is on the source chain (where the swap starts)
        await this.ensureCorrectChain(ctx);

        // ---------- Ensure route exists ----------
        if (!this.route) {
            const owner = ctx.getWagmiAddress();
            if (!owner) throw new Error(WALLET_NOT_CONNECTED);
            this.route = await requestBestRoute({
                fromChainId: this.chainId,
                toChainId: this.dstChain,
                fromTokenAddress: this.mint,
                toTokenAddress: this.toMint,
                fromAmount: this.amount.toString(),
                fromAddress: owner,
            });
        }

        const firstStep: any = this.route?.steps?.[0];
        if (!firstStep) {
            throw new Error(NO_STEPS_IN_ROUTE);
        }

        // ---------- Execute swap transaction ----------
        // Fetch transaction data for the step (required; route steps come without it)
        const populatedStep = await getStepTransaction(firstStep);

        const txRequest = populatedStep?.transactionRequest ?? undefined;
        if (!txRequest) {
            throw new Error(MISSING_TX_REQUEST);
        }
        const wagmiConfig = ctx.wagmiConfig;
        // @ts-expect-error
        const txHash = await sendTransaction(wagmiConfig, {
            ...txRequest,
            type: "legacy",
        });

        this.txHash = txHash;
        // Wait for confirmation
        const pc = ctx.getPublicClient(this.chainId);
        await pc.waitForTransactionReceipt({ hash: txHash });

        this.status = "CONFIRMED";
    }

    override toJSON(): Record<string, unknown> {
        return { ...super.toJSON(), dstChain: this.dstChain, toMint: this.toMint };
    }
}
