"use client";

import { balanceKey } from "../core/balance-utils";

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

/**
 * Compute how much of the swap token can be swapped while leaving a minimum remainder.
 * This is a direct extraction of the pure logic previously embedded in the page component.
 */
export function computeSwapAmount(
    intendedDepositAmount: bigint,
    availableSwapTokenBalance: bigint,
    availableDepositTokenBalance: bigint,
    minRemainingSwapTokenBalance: bigint,
): bigint {
    // How much additional deposit-token do we need?
    const swapNeeded =
        intendedDepositAmount > availableDepositTokenBalance
            ? intendedDepositAmount - availableDepositTokenBalance
            : BigInt(0);

    // How much swap-token can we safely spend while leaving the required remainder?
    const maxSwappable =
        availableSwapTokenBalance > minRemainingSwapTokenBalance
            ? availableSwapTokenBalance - minRemainingSwapTokenBalance
            : BigInt(0);

    // We can only swap what is both needed and affordable.
    return swapNeeded < maxSwappable ? swapNeeded : maxSwappable;
}
