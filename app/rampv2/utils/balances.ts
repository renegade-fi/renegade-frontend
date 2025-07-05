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
