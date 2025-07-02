import { getStepTransaction, type Route } from "@lifi/sdk";
import { sendTransaction } from "wagmi/actions";
import { requestBestRoute } from "../integrations/internal/lifi";
import type { StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * Executes a cross-chain bridge transaction using a LI.FI route.
 *
 * For now we assume the route requires a single on-chain transaction on the
 * source chain; the bridging protocol then handles the remainder off-chain.
 */
export class BridgeStep extends BaseStep {
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
        super(crypto.randomUUID(), "BRIDGE", fromChain, fromMint, amount);
        this.dstChain = toChain;
        this.toMint = toMint;
        this.route = route;
    }

    /**
     * Determine if this step needs an ERC-20 approval before execution. We do
     * this by inspecting the first step of the LI.FI route and returning the
     * spender + amount if required.
     */
    override async approvalRequirement(ctx: StepExecutionContext) {
        if (!this.route) {
            const owner = ctx.getWagmiAddress();
            if (!owner) throw new Error("BridgeStep: wallet not connected");

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

        return approvalAddress ? { spender: approvalAddress, amount: approvalAmount } : undefined;
    }

    async run(ctx: StepExecutionContext): Promise<void> {
        // Ensure wallet is connected to the source chain
        await this.ensureCorrectChain(ctx);

        // ---------- Ensure route exists ----------
        if (!this.route) {
            const owner = ctx.getWagmiAddress();
            if (!owner) throw new Error("BridgeStep: wallet not connected");

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
        if (!firstStep) throw new Error("BridgeStep: no steps in LI.FI route");

        // ---------- Execute bridge transaction ----------
        const populatedStep = await getStepTransaction(firstStep);

        const txRequest = populatedStep?.transactionRequest;
        if (!txRequest) throw new Error("BridgeStep: route missing transaction request");

        const wagmiConfig = ctx.wagmiConfig;
        // @ts-expect-error
        const txHash = await sendTransaction(wagmiConfig, txRequest);

        this.txHash = txHash;
        const pc = ctx.getPublicClient(this.chainId);
        await pc.waitForTransactionReceipt({ hash: txHash });

        this.status = "CONFIRMED";
    }

    override toJSON(): Record<string, unknown> {
        return { ...super.toJSON(), dstChain: this.dstChain, toMint: this.toMint };
    }
}
