import type { Exchange } from "@renegade-fi/react";
import { type QueryClient, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { priceQueryOptions } from "@/hooks/use-price-query";
import { createSnapshotPriceQueryKey } from "@/lib/query";

/** Check if a snapshot is already cached. */
const hasSnapshot = (qc: QueryClient, baseMint: `0x${string}`, exchange: Exchange) =>
    qc.getQueryData<number>(createSnapshotPriceQueryKey({ baseMint, exchange })) !== undefined;

/** Hook to retrieve a price without subscribing to the live price. */
export const usePriceSnapshot = (baseMint: `0x${string}`, exchange: Exchange = "renegade") => {
    const qc = useQueryClient();

    const opts = priceQueryOptions(baseMint, exchange);
    const queryKey = createSnapshotPriceQueryKey({ baseMint, exchange });
    const cached = hasSnapshot(qc, baseMint, exchange);

    return useQuery({
        ...opts,
        enabled: !cached,
        initialData: cached ? () => qc.getQueryData<number>(queryKey)! : undefined,
        queryKey,
    });
};

/** Hook to retrieve prices without subscribing to the live price. */
export const usePricesSnapshot = (mints: `0x${string}`[], exchange: Exchange = "renegade") => {
    const qc = useQueryClient();
    return useQueries({
        combine: (results) => {
            const map = new Map<`0x${string}`, number>();
            results.forEach((result, i) => {
                map.set(mints[i], result.data ?? 0);
            });
            return map;
        },
        queries: mints.map((mint) => {
            const opts = priceQueryOptions(mint, exchange);
            const queryKey = createSnapshotPriceQueryKey({ baseMint: mint, exchange });
            const cached = hasSnapshot(qc, mint, exchange);

            return {
                ...opts,
                enabled: !cached,
                initialData: cached ? () => qc.getQueryData<number>(queryKey)! : undefined,
                queryKey,
            };
        }),
    });
};
