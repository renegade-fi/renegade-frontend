"use client"

import {
  isServer,
  QueryClient,
  QueryClientProvider,
  MutationCache,
  Query,
} from "@tanstack/react-query"

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
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient(mutationCache?: MutationCache) {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient(mutationCache)
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient(
    new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        const nonStaticQueries = (query: Query) => {
          const defaultStaleTime =
            queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0
          const staleTimes = query.observers
            .map((observer) => observer.options.staleTime ?? Infinity)
            .filter((staleTime): staleTime is number => staleTime !== undefined)

          const staleTime =
            query.getObserversCount() > 0
              ? Math.min(...staleTimes)
              : defaultStaleTime

          return staleTime !== Number.POSITIVE_INFINITY
        }
        queryClient.invalidateQueries({
          predicate: nonStaticQueries,
        })
      },
      onError: (error, _variables, _context, mutation) => {
        console.error("Mutation error: ", {
          mutationKey: mutation.options.mutationKey,
          error,
        })
        console.log("TODO: Refresh wallet after error?")
      },
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
