import type { Exchange } from "@renegade-fi/react";
import { queryOptions, type UseQueryOptions, useQuery } from "@tanstack/react-query";
import React from "react";

import { client } from "@/lib/clients/price-reporter";
import { createPriceQueryKey, createPriceTopic } from "@/lib/query";
import { isSupportedExchange } from "@/lib/token";

import { usePriceWebSocket } from "./use-price-websocket";

export const STALE_TIME_MS = 60_000;

export interface QueryParams {
    baseMint: `0x${string}`;
    exchange?: Exchange;
    isSnapshot?: boolean;
    quote?: `0x${string}`;
}

export function priceQueryOptions(params: QueryParams): UseQueryOptions<number> {
    const topic = createPriceTopic(params);
    const queryKey = createPriceQueryKey(params);

    return queryOptions<number>({
        queryKey,
        queryFn: () => {
            const [ex, base, quote] = topic.split("-") as [Exchange, `0x${string}`, `0x${string}`];
            return client.getPriceByTopic(ex, base, quote);
        },
    });
}

export function usePriceQuery(params: QueryParams) {
    const opts = priceQueryOptions(params);
    const topic = createPriceTopic(params);
    const { subscribeToTopic, unsubscribeFromTopic } = usePriceWebSocket();
    const isSupported = isSupportedExchange(params.baseMint, params.exchange ?? "renegade");

    React.useEffect(() => {
        if (!isSupported) return;
        subscribeToTopic(topic);
        return () => {
            unsubscribeFromTopic(topic);
        };
    }, [isSupported, subscribeToTopic, unsubscribeFromTopic, topic]);

    return useQuery<number>({
        ...opts,
        initialData: 0,
        staleTime: STALE_TIME_MS,
        enabled: isSupported,
    });
}
