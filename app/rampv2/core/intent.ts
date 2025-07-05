import type { getRoutes } from "@lifi/sdk";
import { parseUnits } from "viem/utils";
import { getTokenByAddress, getTokenByTicker } from "../token-registry";
import type { TaskContext } from "./task-context";

export type IntentKind = "DEPOSIT" | "WITHDRAW";

export class Intent {
    readonly kind: IntentKind;
    readonly fromChain: number;
    readonly toChain: number;
    readonly fromTokenAddress: string;
    readonly toTokenAddress: string;
    readonly amountAtomic: bigint;
    readonly fromAddress: string;
    readonly toAddress: string;

    private constructor(params: {
        kind: IntentKind;
        fromChain: number;
        fromAddress: string;
        fromTokenAddress: string;
        toChain: number;
        toAddress: string;
        toTokenAddress: string;
        amountAtomic: bigint;
    }) {
        this.kind = params.kind;
        this.fromChain = params.fromChain;
        this.fromAddress = params.fromAddress;
        this.fromTokenAddress = params.fromTokenAddress;
        this.toChain = params.toChain;
        this.toAddress = params.toAddress;
        this.toTokenAddress = params.toTokenAddress;
        this.amountAtomic = params.amountAtomic;
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

        const amountAtomic = parseUnits(amount, sourceToken.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            kind: "DEPOSIT",
            fromChain: sourceChain,
            toChain: currentChain,
            fromAddress: ctx.getOnchainAddress(sourceChain),
            toAddress: ctx.getOnchainAddress(currentChain),
            fromTokenAddress: sourceToken.address,
            toTokenAddress: operatingToken.address,
            amountAtomic: amountAtomic,
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

        const fromToken = getTokenByAddress(swapToken ?? depositMint, chainId);
        if (!fromToken) return undefined;

        const toToken = getTokenByAddress(depositMint, chainId);
        if (!toToken) return undefined;

        const amountAtomic = parseUnits(amount, toToken.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            kind: "DEPOSIT",
            fromChain: chainId,
            toChain: chainId,
            fromAddress: ctx.getOnchainAddress(chainId),
            toAddress: ctx.getOnchainAddress(chainId),
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amountAtomic: amountAtomic,
        });
    }

    static newWithdrawIntent(
        ctx: TaskContext,
        params: {
            mint: string; // token to withdraw
            chainId: number;
            amount: string; // human-readable units of token
            unwrapToEth?: boolean;
        },
    ): Intent | undefined {
        const { mint, chainId, amount, unwrapToEth = false } = params;

        const token = getTokenByAddress(mint, chainId);
        if (!token) return undefined;

        const owner = ctx.getOnchainAddress(chainId);

        let toTokenAddress = token.address;

        if (unwrapToEth && token.ticker === "WETH") {
            const ethToken = getTokenByTicker("ETH", chainId);
            if (ethToken) {
                toTokenAddress = ethToken.address;
            }
        }

        const amountAtomic = parseUnits(amount, token.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            kind: "WITHDRAW",
            fromChain: chainId,
            toChain: chainId,
            fromAddress: owner,
            toAddress: owner,
            fromTokenAddress: token.address,
            toTokenAddress: toTokenAddress,
            amountAtomic: amountAtomic,
        });
    }
}
