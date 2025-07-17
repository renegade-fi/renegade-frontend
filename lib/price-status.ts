import type { Exchange } from "@renegade-fi/react";

import { isSupportedExchange } from "./token";

/** Mapping of token price statuses with text, statusColor, and priceColor. */
const PRICE_STATUSES = {
    live: {
        priceColor: "",
        statusColor: "text-green-price",
        text: "LIVE",
    },
    noData: {
        priceColor: "text-muted",
        statusColor: "text-muted",
        text: "NO DATA",
    },
    stale: {
        priceColor: "",
        statusColor: "text-red-price",
        text: "STALE",
    },
    unsupported: {
        priceColor: "text-muted",
        statusColor: "text-muted",
        text: "N/A",
    },
} as const;

/** Returns the price status based on price, staleness, mint, and exchange. */
export function getPriceStatus({
    price,
    isStale,
    mint,
    exchange,
}: {
    price: number | undefined;
    isStale: boolean;
    mint: `0x${string}`;
    exchange: Exchange;
}) {
    if (!isSupportedExchange(mint, exchange)) {
        return PRICE_STATUSES.unsupported;
    }
    if (isStale) {
        if (!price) {
            return PRICE_STATUSES.noData;
        }
        return PRICE_STATUSES.stale;
    }
    return PRICE_STATUSES.live;
}
