import { createSignedWebSocketRequest, type OrderMetadata } from "@renegade-fi/react";
import { getSymmetricKey } from "@renegade-fi/react/actions";
import { WS_WALLET_ORDERS_ROUTE } from "@renegade-fi/react/constants";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useConfig, useCurrentWallet } from "@/providers/state-provider/hooks";

type UseOrderHistoryWebsocketParameters = {
    onUpdate: (order: OrderMetadata) => void;
};

export function useOrderHistoryWebSocket(parameters: UseOrderHistoryWebsocketParameters) {
    const { onUpdate } = parameters;
    const { id: walletId } = useCurrentWallet();
    const config = useConfig();

    const url = config?.getWebsocketBaseUrl() ?? "";
    const enabled = Boolean(url && config);

    const { readyState, sendJsonMessage } = useWebSocket(
        url,
        {
            filter: () => false,
            onMessage(event) {
                try {
                    const messageData = JSON.parse(event.data, (key, value) => {
                        if (typeof value === "number" && key !== "price") {
                            return BigInt(value);
                        }
                        return value;
                    });
                    if (
                        walletId &&
                        messageData.topic === WS_WALLET_ORDERS_ROUTE(walletId) &&
                        messageData.event?.type === "OrderMetadataUpdated" &&
                        messageData.event?.order
                    )
                        onUpdate?.(messageData.event.order);
                } catch (_) {}
            },
            share: true,
            shouldReconnect: () => false,
        },
        enabled,
    );

    React.useEffect(() => {
        if (!enabled || readyState !== ReadyState.OPEN) return;

        // Subscribe to wallet updates
        const body = {
            method: "subscribe" as const,
            topic: WS_WALLET_ORDERS_ROUTE(config?.state.id!),
        } as const;

        const symmetricKey = getSymmetricKey(config!);
        const subscriptionMessage = createSignedWebSocketRequest(config!, symmetricKey, body);

        sendJsonMessage(subscriptionMessage);
    }, [config, enabled, readyState, sendJsonMessage]);
}
