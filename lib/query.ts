import type { Exchange } from "@renegade-fi/react";
import type { Query, QueryClient } from "@tanstack/react-query";

import { getDefaultQuote } from "./token";

// Helper function defining a global rule for invalidating queries
// We invalidate queries that are:
// - Not static (finite stale time)
// - Not a price query
//
// TODO: We should invalidate queries related to wallet / on-chain state
// We apply a general global rule for now because it doesn't hurt to have fresh data.
export function shouldInvalidate(query: Query, queryClient: QueryClient) {
    // If the query is a price query, don't invalidate
    if (query.queryKey.includes("price")) {
        return false;
    }

    // Invalidate if the effective stale time is not set to infinite.
    const defaultStaleTime = queryClient.getQueryDefaults(query.queryKey).staleTime ?? 0;

    const staleTimes = query.observers
        .map((observer) => observer.options.staleTime ?? Infinity)
        .filter((staleTime): staleTime is number => staleTime !== undefined);

    const effectiveStaleTime =
        query.getObserversCount() > 0 ? Math.min(...staleTimes) : defaultStaleTime;

    return effectiveStaleTime !== Number.POSITIVE_INFINITY;
}

export function createPriceTopic({
    exchange,
    base,
    quote: _quote,
}: {
    exchange?: Exchange;
    base: `0x${string}`;
    quote?: `0x${string}`;
}): string {
    const quote = _quote ?? getDefaultQuote(base, exchange ?? "renegade").address;
    return `${exchange}-${base}-${quote}`;
}

export function createCanonicalPriceTopic(mint: `0x${string}`): string {
    return `renegade-${mint}`;
}

/** Create a query key for a live price query. */
export function createPriceQueryKey({
    exchange,
    base,
    quote: _quote,
}: {
    exchange?: Exchange;
    base: `0x${string}`;
    quote?: `0x${string}`;
}): string[] {
    if (!exchange || exchange === "renegade") {
        return ["price", "live", "renegade", base];
    }
    const quote = _quote ?? getDefaultQuote(base, exchange).address;
    return ["price", "live", exchange, base, quote];
}

export function createSnapshotPriceQueryKey({
    exchange,
    baseMint,
    quote: _quote,
}: {
    baseMint: `0x${string}`;
    exchange: Exchange;
    quote?: `0x${string}`;
}): string[] {
    const quote = _quote ?? getDefaultQuote(baseMint, exchange).address;
    return ["price", "snapshot", exchange, baseMint, quote];
}

/** Converts a price topic from the Price Reporter into a live price query key. */
export function topicToQueryKey(topic: string): string[] {
    const [exchange, base, quote] = topic.split("-");
    if (exchange === "renegade") {
        return ["price", "live", "renegade", base];
    }
    return ["price", "live", exchange, base, quote];
}
