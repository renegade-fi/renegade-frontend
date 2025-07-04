import { parseUnits } from "viem/utils";
import { Intent } from "./core/intent";
import type { TaskContext } from "./core/task-context";
import { getTokenByAddress, getTokenByTicker } from "./token-registry";

/**
 * Returns true if the token is ETH.
 *
 * If no token is found, returns false.
 */
export function isETH(mint: string, chainId: number) {
    const token = getTokenByAddress(mint, chainId);
    return token?.ticker === "ETH";
}

export function createBridgeIntent(
    ctx: TaskContext,
    params: {
        mint: string;
        sourceChain: number;
        currentChain: number;
        amount: string;
    },
) {
    const { mint, sourceChain, currentChain, amount } = params;
    const sourceToken = getTokenByAddress(mint, sourceChain);
    if (!sourceToken) return undefined;
    const operatingToken = getTokenByTicker(sourceToken.ticker, currentChain);
    if (!operatingToken) return undefined;
    const intent = new Intent({
        kind: "DEPOSIT",
        fromChain: sourceChain,
        fromAddress: ctx.getOnchainAddress(sourceChain),
        toAddress: ctx.getOnchainAddress(currentChain),
        toChain: currentChain,
        fromTokenAddress: sourceToken.address,
        toTokenAddress: operatingToken.address,
        amountAtomic: parseUnits(amount, sourceToken.decimals),
    });
    return intent;
}

/**
 * Create an Intent that represents swapping `swapToken` into `depositMint` on
 * the same chain and then depositing the result.
 *
 * The intent encodes:
 *   fromTokenAddress = swapToken
 *   toTokenAddress   = depositMint
 *   fromChain == toChain == chainId
 *
 * @remarks Returns `undefined` if either token metadata cannot be resolved.
 */
export function createSwapIntent(
    ctx: TaskContext,
    params: {
        swapToken: string; // token we currently hold / will swap from
        depositMint: string; // token we ultimately deposit
        chainId: number;
        amount: string; // human-readable units of depositMint
    },
) {
    const { swapToken, depositMint, chainId, amount } = params;

    const fromToken = getTokenByAddress(swapToken, chainId);
    if (!fromToken) return undefined;
    const toToken = getTokenByAddress(depositMint, chainId);
    if (!toToken) return undefined;

    const intent = new Intent({
        kind: "DEPOSIT",
        fromChain: chainId,
        toChain: chainId,
        fromAddress: ctx.getOnchainAddress(chainId),
        toAddress: ctx.getOnchainAddress(chainId),
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amountAtomic: parseUnits(amount, toToken.decimals),
    });

    return intent;
}
