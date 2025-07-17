import type { getRoutes } from "@lifi/sdk";
import { parseUnits } from "viem/utils";
import { isETH } from "../helpers";
import { getTokenByAddress, getTokenByTicker } from "../token-registry";
import type { TaskContext } from "./task-context";

type IntentKind = "DEPOSIT" | "WITHDRAW";

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
    needsSwap(): boolean {
        return this.fromTokenAddress !== this.toTokenAddress;
    }
    needsWrap(): boolean {
        const isFromEth = isETH(this.fromTokenAddress, this.fromChain);
        const isToEth = isETH(this.toTokenAddress, this.toChain);
        return isFromEth || isToEth;
    }
    needsBridge(): boolean {
        return this.fromChain !== this.toChain;
    }

    /**
     * Returns true if the provided balance (in atomic units) is enough to
     * satisfy this intent.
     */
    isBalanceSufficient(available: bigint): boolean {
        return available >= this.amountAtomic;
    }

    toJson() {
        return {
            amountAtomic: this.amountAtomic.toString(),
            fromAddress: this.fromAddress,
            fromChain: this.fromChain,
            fromTokenAddress: this.fromTokenAddress,
            kind: this.kind,
            toAddress: this.toAddress,
            toChain: this.toChain,
            toTokenAddress: this.toTokenAddress,
        };
    }

    toLifiRouteRequest(): Parameters<typeof getRoutes>[0] {
        return {
            fromAddress: this.fromAddress,
            fromAmount: this.amountAtomic.toString(),
            fromChainId: this.fromChain,
            fromTokenAddress: this.fromTokenAddress,
            toAddress: this.toAddress,
            toChainId: this.toChain,
            toTokenAddress: this.toTokenAddress,
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
            sourceMint: string;
            sourceChain: number;
            targetMint: string;
            targetChain: number;
            amount: string;
        },
    ): Intent | undefined {
        const { sourceMint, sourceChain, targetMint, targetChain, amount } = params;

        const sourceToken = getTokenByAddress(sourceMint, sourceChain);
        if (!sourceToken) return undefined;

        const targetToken = getTokenByAddress(targetMint, targetChain);
        if (!targetToken) return undefined;

        const amountAtomic = parseUnits(amount, sourceToken.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            amountAtomic: amountAtomic,
            fromAddress: ctx.getOnchainAddress(sourceChain),
            fromChain: sourceChain,
            fromTokenAddress: sourceToken.address,
            kind: "DEPOSIT",
            toAddress: ctx.getOnchainAddress(targetChain),
            toChain: targetChain,
            toTokenAddress: targetToken.address,
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

        const amountAtomic = parseUnits(amount, toToken.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            amountAtomic: amountAtomic,
            fromAddress: ctx.getOnchainAddress(chainId),
            fromChain: chainId,
            fromTokenAddress: fromToken.address,
            kind: "DEPOSIT",
            toAddress: ctx.getOnchainAddress(chainId),
            toChain: chainId,
            toTokenAddress: toToken.address,
        });
    }

    static newDepositIntent(
        ctx: TaskContext,
        params: {
            mint: string;
            chainId: number;
            amount: string;
        },
    ): Intent | undefined {
        const { mint, chainId, amount } = params;

        const token = getTokenByAddress(mint, chainId);
        if (!token) return undefined;

        const amountAtomic = parseUnits(amount, token.decimals);
        if (amountAtomic === BigInt(0)) return undefined;

        return new Intent({
            amountAtomic: amountAtomic,
            fromAddress: ctx.getOnchainAddress(chainId),
            fromChain: chainId,
            fromTokenAddress: token.address,
            kind: "DEPOSIT",
            toAddress: ctx.getOnchainAddress(chainId),
            toChain: chainId,
            toTokenAddress: token.address,
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
            amountAtomic: amountAtomic,
            fromAddress: owner,
            fromChain: chainId,
            fromTokenAddress: token.address,
            kind: "WITHDRAW",
            toAddress: owner,
            toChain: chainId,
            toTokenAddress: toTokenAddress,
        });
    }
}
