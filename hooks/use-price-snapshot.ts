import type { Exchange } from "@renegade-fi/react";
import { type QueryClient, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { priceQueryOptions, type QueryParams } from "@/hooks/use-price-query";
import { createPriceQueryKey } from "@/lib/query";

/** Check if a snapshot is already cached. */
const hasSnapshot = (qc: QueryClient, params: QueryParams) =>
    qc.getQueryData<number>(createPriceQueryKey(params)) !== undefined;

/** Hook to retrieve a price without subscribing to the live price. */
export const usePriceSnapshot = (params: QueryParams) => {
    const qc = useQueryClient();

    const opts = priceQueryOptions(params);
    const queryKey = createPriceQueryKey(params);
    const cached = hasSnapshot(qc, params);

    return useQuery({
        ...opts,
        queryKey,
        enabled: !cached,
        initialData: cached ? () => qc.getQueryData<number>(queryKey)! : undefined,
    });
};

/** Hook to retrieve prices without subscribing to the live price. */
export const usePricesSnapshot = (mints: `0x${string}`[], exchange: Exchange = "renegade") => {
    const qc = useQueryClient();
    return useQueries({
        queries: mints.map((mint) => {
            const opts = priceQueryOptions({ baseMint: mint, exchange });
            const queryKey = createPriceQueryKey({ baseMint: mint, exchange });
            const cached = hasSnapshot(qc, { baseMint: mint, exchange });

            return {
                ...opts,
                queryKey,
                enabled: !cached,
                initialData: cached ? () => qc.getQueryData<number>(queryKey)! : undefined,
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
