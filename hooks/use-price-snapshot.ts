import type { Exchange } from "@renegade-fi/react";
import { type QueryClient, useQueries, useQuery } from "@tanstack/react-query";

import { priceQueryOptions } from "@/hooks/use-price-query";
import { createPriceQueryKey } from "@/lib/query";

/** Check if a snapshot is already cached. */
const hasSnapshot = (qc: QueryClient, baseMint: `0x${string}`, exchange: Exchange) =>
    qc.getQueryData<number>(createPriceQueryKey({ exchange, base: baseMint, isSnapshot: true })) !==
    undefined;

/** Hook to retrieve a price without subscribing to the live price. */
export const usePriceSnapshot = (baseMint: `0x${string}`, exchange: Exchange = "renegade") => {
    const opts = priceQueryOptions(baseMint, exchange, true /** isSnapshot */);

    return useQuery({
        ...opts,
    });
};

/** Hook to retrieve prices without subscribing to the live price. */
export const usePricesSnapshot = (mints: `0x${string}`[], exchange: Exchange = "renegade") => {
    return useQueries({
        queries: mints.map((mint) => {
            const opts = priceQueryOptions(mint, exchange, true /** isSnapshot */);

            return {
                ...opts,
            };
        }),
        combine: (results) => {
            const map = new Map<`0x${string}`, number>();
            results.forEach((result, i) => {
                map.set(mints[i], result.data ?? 0);
            });
            return map;
        },
    });
};
