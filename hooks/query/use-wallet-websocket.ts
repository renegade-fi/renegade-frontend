import { createSignedWebSocketRequest } from "@renegade-fi/react";
import { getSymmetricKey } from "@renegade-fi/react/actions";
import { WALLET_ROUTE } from "@renegade-fi/react/constants";
import React from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useConfig, useCurrentWallet } from "@/providers/state-provider/hooks";
import type { CachedWallet } from "@/providers/state-provider/schema";

import { parseBigJSON } from "./utils";

export type UseWalletWebsocketParameters = {
    onUpdate: (wallet: CachedWallet) => void;
};

export function useWalletWebsocket(parameters: UseWalletWebsocketParameters) {
    const { onUpdate } = parameters;
    const { id: walletId } = useCurrentWallet();
    const config = useConfig();

    const url = config?.getWebsocketBaseUrl() ?? "";
    const enabled = Boolean(url && config);

    const { readyState, sendJsonMessage } = useWebSocket(
        url,
        {
            filter: () => false,
            onMessage: (event) => {
                try {
                    const messageData = parseBigJSON(event.data);
                    if (
                        walletId &&
                        messageData.topic === WALLET_ROUTE(walletId) &&
                        messageData.event?.type === "WalletUpdate" &&
                        messageData.event?.wallet
                    )
                        onUpdate?.(messageData.event.wallet);
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
            method: "subscribe",
            topic: WALLET_ROUTE(config?.state.id!),
        } as const;

        const symmetricKey = getSymmetricKey(config!);
        const subscriptionMessage = createSignedWebSocketRequest(config!, symmetricKey, body);

        sendJsonMessage(subscriptionMessage);
    }, [config, enabled, readyState, sendJsonMessage]);
}
