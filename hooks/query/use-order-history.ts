import type { OrderMetadata } from "@renegade-fi/react";
import { type GetOrderHistoryReturnType, getOrderHistory } from "@renegade-fi/react/actions";
import {
    type QueryKey,
    type UseQueryOptions,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useConfig, useCurrentWallet } from "@/providers/state-provider/hooks";
import type { CachedWallet } from "@/providers/state-provider/schema";

import { useOrderHistoryWebSocket } from "./use-order-history-websocket";

function orderHistoryQueryKey(options: CachedWallet) {
    return [
        "order-history",
        {
            scopeKey: options.id,
        },
    ] as QueryKey;
}

export function useOrderHistory<TData = GetOrderHistoryReturnType>(options?: {
    query?: Partial<UseQueryOptions<GetOrderHistoryReturnType, Error, TData>>;
}) {
    const queryClient = useQueryClient();
    const currentWallet = useCurrentWallet();
    const config = useConfig();
    const queryKey = orderHistoryQueryKey(currentWallet);
    const enabled = Boolean(currentWallet.seed && currentWallet.id);

    useOrderHistoryWebSocket({
        onUpdate: (incoming: OrderMetadata) => {
            if (queryKey) {
                const existingMap =
                    queryClient.getQueryData<GetOrderHistoryReturnType>(queryKey) || new Map();
                const existingOrder = existingMap.get(incoming.id);

                if (!existingOrder || incoming.state !== existingOrder.state) {
                    const newMap = new Map(existingMap);
                    newMap.set(incoming.id, incoming);
                    queryClient.setQueryData(queryKey, newMap);
                }
            }
        },
    });

    return useQuery<GetOrderHistoryReturnType, Error, TData>({
        enabled,
        queryFn: async () => {
            if (!currentWallet.seed || !currentWallet.id || !config)
                throw new Error("No wallet found in storage");
            return getOrderHistory(config);
        },
        queryKey,
        ...options?.query,
    });
}
