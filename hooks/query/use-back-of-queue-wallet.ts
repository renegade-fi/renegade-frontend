import {
    type GetBackOfQueueWalletReturnType,
    getBackOfQueueWallet,
} from "@renegade-fi/react/actions";
import {
    type QueryKey,
    type UseQueryOptions,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useConfig, useCurrentWallet } from "@/providers/state-provider/hooks";
import type { CachedWallet } from "@/providers/state-provider/schema";

import { useWalletWebsocket } from "./use-wallet-websocket";

function walletQueryKey(options: CachedWallet) {
    return [
        "back-of-queue-wallet",
        {
            scopeKey: options.id,
        },
    ] as QueryKey;
}

export function useBackOfQueueWallet<TData = GetBackOfQueueWalletReturnType>(options?: {
    query?: Partial<UseQueryOptions<GetBackOfQueueWalletReturnType, Error, TData>>;
}) {
    const queryClient = useQueryClient();
    const currentWallet = useCurrentWallet();
    const config = useConfig();
    const queryKey = walletQueryKey(currentWallet);
    const enabled = Boolean(currentWallet.seed && currentWallet.id);

    useWalletWebsocket({
        onUpdate: (wallet) => {
            if (wallet && queryClient && queryKey) {
                queryClient.setQueryData(queryKey, wallet);
            }
        },
    });

    return useQuery<GetBackOfQueueWalletReturnType, Error, TData>({
        queryKey,
        queryFn: async () => {
            if (!currentWallet.seed || !currentWallet.id || !config)
                throw new Error("No wallet found in storage");
            return getBackOfQueueWallet(config);
        },
        enabled,
        ...options?.query,
    });
}
