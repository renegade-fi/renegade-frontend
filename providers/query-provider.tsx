"use client";

import { isServer, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { shouldInvalidate } from "@/lib/query";

function makeQueryClient(mutationCache?: MutationCache) {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000,
            },
        },
        ...(mutationCache ? { mutationCache } : {}),
    });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(mutationCache?: MutationCache) {
    if (isServer) {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        if (!browserQueryClient) browserQueryClient = makeQueryClient(mutationCache);
        return browserQueryClient;
    }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient(
        new MutationCache({
            onError: (error, _variables, _context, mutation) => {
                console.error("Mutation error: ", {
                    error,
                    mutationKey: mutation.options.mutationKey,
                });
            },
            onSuccess: (_data, _variables, _context, _mutation) => {
                queryClient.invalidateQueries({
                    predicate: (query) => shouldInvalidate(query, queryClient),
                });
            },
        }),
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
