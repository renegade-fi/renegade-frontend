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
