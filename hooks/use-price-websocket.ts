import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import { client } from "@/lib/clients/price-reporter";
import { formatDynamicCurrency } from "@/lib/format";
import { topicToQueryKey } from "@/lib/query";

import { STALE_TIME_MS } from "./use-price-query";

export function usePriceWebSocket() {
    const queryClient = useQueryClient();

    const { sendMessage, readyState } = useWebSocket(client.getWebSocketUrl(), {
        share: true,
        filter: () => false,
        onMessage: (event) => {
            const { topic, price: incomingPrice } = JSON.parse(event.data);
            if (!topic || !incomingPrice) return;

            const queryKey = topicToQueryKey(topic);
            const dataUpdatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt;
            const oldPrice = queryClient.getQueryData<number>(queryKey);

            if (!dataUpdatedAt || !oldPrice) {
                queryClient.setQueryData(queryKey, incomingPrice);
                return;
            }

            const timeSinceUpdate = Date.now() - dataUpdatedAt;
            const randomDelay = Math.floor(Math.random() * 2000 + 500);

            const isPastDelay = timeSinceUpdate > randomDelay;
            const isDiff = formatDynamicCurrency(oldPrice) !== formatDynamicCurrency(incomingPrice);
            const isStale = timeSinceUpdate >= STALE_TIME_MS * 0.8;

            const shouldUpdate = (isPastDelay && isDiff) || isStale;
            if (shouldUpdate) {
                queryClient.setQueryData(queryKey, incomingPrice);
            }
        },
        shouldReconnect: () => true,
    });

    const subscribeToTopic = React.useCallback(
        (topic: string) => {
            if (readyState === ReadyState.OPEN) {
                sendMessage(
                    JSON.stringify({
                        method: "subscribe",
                        topic,
                    }),
                );
            }
        },
        [readyState, sendMessage],
    );

    const unsubscribeFromTopic = React.useCallback(
        (topic: string) => {
            if (readyState === ReadyState.OPEN) {
                sendMessage(
                    JSON.stringify({
                        method: "unsubscribe",
                        topic,
                    }),
                );
            }
        },
        [readyState, sendMessage],
    );

    return { subscribeToTopic, unsubscribeFromTopic, readyState };
}
