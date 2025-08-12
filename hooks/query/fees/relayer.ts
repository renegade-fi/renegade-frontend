import { queryOptions } from "@tanstack/react-query";

interface QueryParams {
    ticker?: string;
}
/**
 * Returns the relayer fee for the given ticker in basis points
 * @param params - The query parameters
 * @returns The relayer fee in basis points
 */
export function relayerFeeQueryOptions(params: QueryParams) {
    return queryOptions({
        queryFn: async () => {
            // TODO: implement
            return 2;
        },
        queryKey: ["fees", "relayer", { ticker: params.ticker }],
        retry: true,
        staleTime: Number.POSITIVE_INFINITY,
    });
}
