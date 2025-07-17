import { useQueries } from "@tanstack/react-query";
import React from "react";
import { ReadyState } from "react-use-websocket";

import { client } from "@/lib/clients/price-reporter";
import { createCanonicalPriceTopic, createPriceQueryKey } from "@/lib/query";

import { usePriceWebSocket } from "./use-price-websocket";

export function usePriceQueries(mints: `0x${string}`[]) {
    const subscribedTopics = React.useRef<Set<string>>(new Set());
    const { subscribeToTopic, unsubscribeFromTopic, readyState } = usePriceWebSocket();

    React.useEffect(() => {
        if (readyState === ReadyState.OPEN) {
            mints.forEach((mint) => {
                const topic = createCanonicalPriceTopic(mint);
                if (!subscribedTopics.current.has(topic)) {
                    subscribeToTopic(topic);
                    subscribedTopics.current.add(topic);
                }
            });
        }
    }, [mints, readyState, subscribeToTopic]);

    React.useEffect(() => {
        const currentTopics = subscribedTopics.current;
        return () => {
            currentTopics.forEach((topic) => {
                unsubscribeFromTopic(topic);
            });
        };
    }, [unsubscribeFromTopic]);

    return useQueries({
        queries: mints.map((mint) => ({
            initialData: 0,
            queryFn: () => client.getPrice(mint),
            queryKey: createPriceQueryKey({
                base: mint,
                exchange: "renegade",
            }),
            retry: false,
            staleTime: Infinity,
        })),
    });
}
