import { useMemo } from "react";

import { formatUnits } from "viem";
import { arbitrum, base } from "viem/chains";

import { usePricesSnapshot } from "@/hooks/use-price-snapshot";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { resolveAddress, resolveTicker } from "@/lib/token";

import { useTvl } from "./use-tvl";

type RawTvl = { address: `0x${string}`; tvl: bigint };
type MergedTvl = {
    ticker: string;
    baseTvl: bigint;
    arbitrumTvl: bigint;
    totalTvl: bigint;
};
type PricedTvl = MergedTvl & {
    baseTvlUsd: number;
    arbitrumTvlUsd: number;
    totalTvlUsd: number;
};

// --- Helpers --- //

// Immutable "template" for a new row
const emptyRow = (ticker: string) => ({
    arbitrumTvl: BigInt(0),
    baseTvl: BigInt(0),
    ticker,
    totalTvl: BigInt(0),
});

type MutableMerged = ReturnType<typeof emptyRow>;

/**
 * Push one chain's TVL array into the aggregate map.
 */
function accumulateTvlByTicker(
    src: RawTvl[],
    field: "arbitrumTvl" | "baseTvl",
    map: Map<string, MutableMerged>,
): void {
    src.forEach(({ address, tvl }) => {
        const ticker = resolveAddress(address).ticker;
        const row = map.get(ticker) ?? emptyRow(ticker);
        row[field] = tvl;
        row.totalTvl = row.baseTvl + row.arbitrumTvl;
        map.set(ticker, row);
    });
}

/**
 * Merge Arbitrum and Base TVL arrays into one array keyed by ticker.
 */
function mergeByTicker(arb: RawTvl[] | undefined, bas: RawTvl[] | undefined): MergedTvl[] {
    const map = new Map<string, MutableMerged>();

    if (arb?.length) {
        accumulateTvlByTicker(arb, "arbitrumTvl", map);
    }
    if (bas?.length) {
        accumulateTvlByTicker(bas, "baseTvl", map);
    }

    if (map.size === 0) {
        return [];
    }

    return [...map.values()];
}

function addUsdValues(merged: MergedTvl[], prices: Map<`0x${string}`, number>): PricedTvl[] {
    return merged.map((row) => {
        const { address, decimals } = resolveTicker(row.ticker);
        const price = prices.get(address);
        const toUsd = (amount: bigint) =>
            price ? Number(formatUnits(amountTimesPrice(amount, price), decimals)) : 0;
        return {
            ...row,
            arbitrumTvlUsd: toUsd(row.arbitrumTvl),
            baseTvlUsd: toUsd(row.baseTvl),
            totalTvlUsd: toUsd(row.totalTvl),
        };
    });
}

export function useTvlData(chainId: number): PricedTvl[] {
    const { data: arbTvl } = useTvl(arbitrum.id);
    const { data: baseTvl } = useTvl(base.id);

    // Collect all mint addresses we must price
    const mintAddresses = useMemo(() => {
        const set = new Set<`0x${string}`>();
        arbTvl?.forEach((t) => set.add(t.address));
        baseTvl?.forEach((t) => set.add(t.address));
        return [...set];
    }, [arbTvl, baseTvl]);

    const prices = usePricesSnapshot(mintAddresses);

    // Merge if chain ID is 0, otherwise filter by chain ID
    const merged = useMemo(() => {
        if (chainId === 0) {
            return mergeByTicker(arbTvl, baseTvl);
        } else if (chainId === arbitrum.id) {
            return mergeByTicker(arbTvl, undefined);
        } else if (chainId === base.id) {
            return mergeByTicker(undefined, baseTvl);
        } else {
            return [];
        }
    }, [arbTvl, baseTvl, chainId]);
    const priced = useMemo(() => addUsdValues(merged, prices), [merged, prices]);

    return priced;
}
