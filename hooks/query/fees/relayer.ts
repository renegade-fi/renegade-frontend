import { getSDKConfig } from "@renegade-fi/react";
import type { ChainId } from "@renegade-fi/react/constants";
import { queryOptions } from "@tanstack/react-query";
import { DISPLAY_TOKENS } from "@/lib/token";
import { BPS_PER_DECIMAL } from "./constants";

interface QueryParams {
    chainId: ChainId;
}

interface QueryParamsWithTicker extends QueryParams {
    ticker: string;
}

type RelayerFeesResponse = {
    fees: Array<{ ticker: string; fee: string }>;
};

/**
 * Returns a map of ticker to relayer fee in basis points
 * @param params - The query parameters
 * @returns A map of ticker to relayer fee in basis points
 */
export function relayerFeeMapQueryOptions(params: QueryParams) {
    return queryOptions({
        gcTime: Number.POSITIVE_INFINITY,
        queryFn: async () => {
            const sdkCfg = getSDKConfig(params.chainId);
            const host = sdkCfg.relayerUrl;
            const baseUrl = `https://${host}`;

            const tickersParam = Array.from(
                new Set(
                    DISPLAY_TOKENS({ chainId: params.chainId, hideQuoteTokens: false }).map((t) =>
                        t.ticker.toUpperCase(),
                    ),
                ),
            ).join(",");

            const url = `${baseUrl}/v0/order_book/relayer-fees?tickers=${tickersParam}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`Failed to fetch relayer fees: ${res.status}`);
            }
            const data = (await res.json()) as RelayerFeesResponse;

            const feeMap = new Map<string, number>();
            for (const entry of data.fees ?? []) {
                const key = entry.ticker.toUpperCase();
                const parsed = Number.parseFloat(entry.fee); // parse f64 from string
                const bps = Number.isFinite(parsed) ? Math.round(parsed * BPS_PER_DECIMAL) : 0; // convert to bps and round to nearest integer
                feeMap.set(key, bps);
            }

            return feeMap;
        },
        queryKey: ["fees", "relayer", { chainId: params.chainId }],
        retry: true,
        staleTime: Number.POSITIVE_INFINITY,
    });
}

/**
 * Returns the relayer fee for the given ticker in basis points
 * @param params - The query parameters
 * @returns The relayer fee for the given ticker in basis points
 */
export function relayerFeeQueryOptions(params: QueryParamsWithTicker) {
    const base = relayerFeeMapQueryOptions({ chainId: params.chainId });
    return queryOptions({
        ...base,
        select: (map) => {
            const key = params.ticker.toUpperCase();
            const value = map.get(key);
            if (!value) {
                throw new Error(`Relayer fee not found for ticker: ${params.ticker}`);
            }
            return value;
        },
    });
}
