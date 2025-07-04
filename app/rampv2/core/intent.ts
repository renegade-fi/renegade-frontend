import type { getRoutes } from "@lifi/sdk";
import { parseUnits } from "viem/utils";
import { getTokenByAddress, getTokenByTicker } from "../token-registry";
import type { TaskContext } from "./task-context";

export type IntentKind = "DEPOSIT" | "WITHDRAW";

export class Intent {
    /* ========= raw fields ========= */
    readonly kind!: IntentKind;
    readonly fromChain!: number;
    readonly toChain!: number;
    readonly fromTokenAddress!: string;
    readonly toTokenAddress!: string;
    readonly amountAtomic!: bigint;
    readonly fromAddress!: string;
    readonly toAddress!: string;

    constructor(params: {
        kind: IntentKind;
        fromChain: number;
        fromAddress: string;
        fromTokenAddress: string;
        toChain: number;
        toAddress: string;
        toTokenAddress: string;
        amountAtomic: bigint;
    }) {
        Object.assign(this, params);
    }

    /* ========= helpers ========= */
    isDeposit() {
        return this.kind === "DEPOSIT";
    }
    isWithdraw() {
        return this.kind === "WITHDRAW";
    }
    needsRouting(): boolean {
        return this.fromChain !== this.toChain || this.fromTokenAddress !== this.toTokenAddress;
    }

    toJson() {
        return {
            kind: this.kind,
            fromChain: this.fromChain,
            fromAddress: this.fromAddress,
            fromTokenAddress: this.fromTokenAddress,
            toChain: this.toChain,
            toAddress: this.toAddress,
            toTokenAddress: this.toTokenAddress,
            amountAtomic: this.amountAtomic.toString(),
        };
    }

    toLifiRouteRequest(): Parameters<typeof getRoutes>[0] {
        return {
            fromChainId: this.fromChain,
            toChainId: this.toChain,
            fromAmount: this.amountAtomic.toString(),
            fromTokenAddress: this.fromTokenAddress,
            toTokenAddress: this.toTokenAddress,
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
        };
    }

    /* ========= factory helpers (idiomatic new*) ========= */

    /**
     * Create an Intent that represents bridging a token from `sourceChain` to the
     * current operating chain (`currentChain`).
     *
     * Returns `undefined` if token metadata cannot be resolved.
     */
    static newBridgeIntent(
        ctx: TaskContext,
        params: {
            mint: string;
            sourceChain: number;
            currentChain: number;
            amount: string;
        },
    ): Intent | undefined {
        const { mint, sourceChain, currentChain, amount } = params;

        const sourceToken = getTokenByAddress(mint, sourceChain);
        if (!sourceToken) return undefined;

        const operatingToken = getTokenByTicker(sourceToken.ticker, currentChain);
        if (!operatingToken) return undefined;

        return new Intent({
            kind: "DEPOSIT",
            fromChain: sourceChain,
            toChain: currentChain,
            fromAddress: ctx.getOnchainAddress(sourceChain),
            toAddress: ctx.getOnchainAddress(currentChain),
            fromTokenAddress: sourceToken.address,
            toTokenAddress: operatingToken.address,
            amountAtomic: parseUnits(amount, sourceToken.decimals),
        });
    }

    /**
     * Create an Intent that represents swapping `swapToken` into `depositMint` on
     * the same chain and then depositing the result.
     *
     * Returns `undefined` if token metadata cannot be resolved.
     */
    static newSwapIntent(
        ctx: TaskContext,
        params: {
            swapToken: string; // token held / to swap from
            depositMint: string; // token ultimately deposited
            chainId: number;
            amount: string; // human-readable units of depositMint
        },
    ): Intent | undefined {
        const { swapToken, depositMint, chainId, amount } = params;

        const fromToken = getTokenByAddress(swapToken, chainId);
        if (!fromToken) return undefined;

        const toToken = getTokenByAddress(depositMint, chainId);
        if (!toToken) return undefined;

        return new Intent({
            kind: "DEPOSIT",
            fromChain: chainId,
            toChain: chainId,
            fromAddress: ctx.getOnchainAddress(chainId),
            toAddress: ctx.getOnchainAddress(chainId),
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amountAtomic: parseUnits(amount, toToken.decimals),
        });
    }
}
