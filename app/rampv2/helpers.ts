import type { Route } from "@lifi/sdk";
import type { Task } from "./core/task";
import { getTokenByAddress } from "./token-registry";

/**
 * Returns true if the token is ETH.
 *
 * If no token is found, returns false.
 */
export function isETH(mint: string, chainId: number) {
    const token = getTokenByAddress(mint, chainId);
    return token?.ticker === "ETH";
}

/* Returns a unique key for a token on a chain */
export function balanceKey(chainId: number, token: string): string {
    return `${chainId}-${token.toLowerCase()}`;
}

/* Returns true if the route contains a bridge step */
export function isBridge(route: Route) {
    return route.steps.find((s) => s.action.fromChainId !== s.action.toChainId);
}

/* Returns true if the route contains a swap step */
export function isSwap(route: Route) {
    return route.steps.find(
        (s) =>
            s.action.fromChainId === s.action.toChainId &&
            s.action.fromToken.address.toLowerCase() !== s.action.toToken.address.toLowerCase(),
    );
}

export function isWrap(route: Route) {
    const swapStep = route.steps.find(
        (s) =>
            s.action.fromChainId === s.action.toChainId &&
            s.action.fromToken.address.toLowerCase() !== s.action.toToken.address.toLowerCase(),
    );
    return swapStep && isETH(swapStep.action.fromToken.address, swapStep.action.fromChainId);
}

/**
 * Build a balances cache keyed by balanceKey(network, mint).
 */
export function buildBalancesCache(params: {
    network: number;
    depositMint: string;
    depositRaw?: bigint;
    swapMint?: string;
    swapRaw?: bigint;
}): Record<string, bigint> {
    const { network, depositMint, depositRaw = BigInt(0), swapMint, swapRaw = BigInt(0) } = params;

    const cache: Record<string, bigint> = {};
    if (depositMint) {
        cache[balanceKey(network, depositMint)] = depositRaw;
    }
    if (swapMint) {
        cache[balanceKey(network, swapMint)] = swapRaw;
    }
    return cache;
}

/** Returns the task's current state as a displayable string. */
export function getTaskStateLabel(task: Task): string {
    const state = String(task.state());
    if (state === "AwaitingWallet") return "Awaiting Wallet";
    return state;
}
