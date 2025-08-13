import type { Exchange } from "@renegade-fi/react";
import { getDefaultQuoteToken } from "@renegade-fi/token-nextjs";

import { isSupportedExchange, resolveAddress, USDT_TICKER } from "./token";

type UrlBuilder = (base: string, quote: string) => string;

// Default URL builders per exchange for arbitrary base/quote pairs
const DEFAULT_URL_BUILDERS: Record<"binance" | "coinbase" | "kraken" | "okx", UrlBuilder> = {
    binance: (base, quote) => `https://www.binance.com/en/trade/${base}_${quote}`,
    coinbase: (base, quote) => `https://www.coinbase.com/advanced-trade/spot/${base}-${quote}`,
    kraken: (base, quote) => `https://pro.kraken.com/app/trade/${base}-${quote}`,
    okx: (base, quote) => `https://www.okx.com/trade-spot/${base}-${quote}`,
};

// Explicit USDT overrides per exchange
const USDT_OVERRIDES: Partial<Record<Exchange, string>> = {
    binance: "https://www.binance.com/en/trade/USDC_USDT",
    coinbase: "https://www.coinbase.com/advanced-trade/spot/USDT-USD",
    kraken: "https://pro.kraken.com/app/trade/USDT-USD",
    okx: "https://www.okx.com/trade-spot/USDC-USDT",
};

/**
 * Returns a centralized-exchange trading URL for a given base token and exchange.
 * - USDT has specific destination URLs (see USDT_OVERRIDES).
 * - Otherwise constructs the URL using the exchange-specific tickers.
 */
export function constructExchangeUrl(exchange: Exchange, mint: `0x${string}`) {
    if (!isSupportedExchange(mint, exchange)) return undefined;

    const token = resolveAddress(mint);

    // USDT: return explicit links per exchange
    if (token.ticker === USDT_TICKER) return USDT_OVERRIDES[exchange] ?? "";

    // Generic pair: map token symbols for the target exchange
    const baseTicker = token.getExchangeTicker(exchange);
    const quoteTicker = getDefaultQuoteToken(exchange).getExchangeTicker(exchange);
    if (!baseTicker || !quoteTicker) return undefined;

    const builder = DEFAULT_URL_BUILDERS[exchange as keyof typeof DEFAULT_URL_BUILDERS];
    return builder ? builder(baseTicker, quoteTicker) : "";
}
