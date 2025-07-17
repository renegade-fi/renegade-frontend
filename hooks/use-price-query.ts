import type { Exchange } from "@renegade-fi/react";
import { queryOptions, type UseQueryOptions, useQuery } from "@tanstack/react-query";
import React from "react";

import { client } from "@/lib/clients/price-reporter";
import { createPriceQueryKey, createPriceTopic } from "@/lib/query";
import { isSupportedExchange } from "@/lib/token";

import { usePriceWebSocket } from "./use-price-websocket";

export const STALE_TIME_MS = 60_000;

export function priceQueryOptions(
    baseMint: `0x${string}`,
    exchange: Exchange = "renegade",
): UseQueryOptions<number> {
    const topic = createPriceTopic({ base: baseMint, exchange });

    return queryOptions<number>({
        queryFn: () => {
            const [ex, base, quote] = topic.split("-") as [Exchange, `0x${string}`, `0x${string}`];
            return client.getPriceByTopic(ex, base, quote);
        }, // Consumers will replace this with either "live" or "snapshot" price query key
        queryKey: ["dummy"],
    });
}

export function usePriceQuery(baseMint: `0x${string}`, exchange: Exchange = "renegade") {
    const opts = priceQueryOptions(baseMint, exchange);
    const topic = createPriceTopic({ base: baseMint, exchange });
    const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket();
    const isSupported = isSupportedExchange(baseMint, exchange);
    const queryKey = createPriceQueryKey({ base: baseMint, exchange });

    React.useEffect(() => {
        if (!isSupported) return;
        subscribeToTopic(topic);
        return () => {
            unsubscribeFromTopic(topic);
        };
    }, [isSupported, subscribeToTopic, unsubscribeFromTopic, topic]);

    return useQuery<number>({
        ...opts,
        enabled: isSupported,
        initialData: 0,
        queryKey,
        staleTime: STALE_TIME_MS,
    });
}
