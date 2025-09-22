import type { Bar } from "@renegade-fi/tradingview-charts";

import { makeAmberApiRequest } from "@/app/trade/[base]/components/charts/tradingview/helpers";

import { oneDayMs, oneMonthMs, twelveMonthsMs } from "@/lib/constants/time";

import { getDefaultQuote, resolveAddress, USDT_TICKER } from "./token";

const BASE_URL = "https://api.amberdata.com";

export async function fetchBars({
    instrument,
    startDateMs,
    endDateMs,
    timeInterval,
    exchange,
}: {
    instrument: string;
    startDateMs: number;
    endDateMs: number;
    timeInterval: "minutes" | "hours" | "days";
    exchange: string;
}) {
    const url = new URL(`${BASE_URL}/markets/spot/ohlcv/${instrument}`);
    url.searchParams.set("exchange", exchange);
    url.searchParams.set("startDate", startDateMs.toString());
    url.searchParams.set("endDate", endDateMs.toString());
    url.searchParams.set("timeInterval", timeInterval);

    // Split the time range into chunks to avoid exceeding the API limit
    const chunkSizeInMs = timeIntervalToTimeRangeLimitMap[timeInterval];
    const chunks = [];
    let currentFrom = startDateMs;

    while (currentFrom < endDateMs) {
        const currentTo = Math.min(currentFrom + chunkSizeInMs, endDateMs);
        chunks.push({ from: currentFrom, to: currentTo });
        currentFrom = currentTo;
    }

    const fetchPromises = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkUrl = new URL(url.toString());
        chunkUrl.searchParams.set("startDate", chunk.from.toString());
        chunkUrl.searchParams.set("endDate", chunk.to.toString());
        fetchPromises.push(makeAmberApiRequest(chunkUrl));
    }

    const responses = await Promise.all(fetchPromises);
    const bars: Bar[] = [];
    for (const response of responses) {
        for (let i = 0; i < response.payload.data.length; i++) {
            const res = response.payload.data[i];
            const bar: Bar = {
                close: res.close,
                high: res.high,
                low: res.low,
                open: res.open,
                time: res.exchangeTimestamp,
                volume: res.volume,
            };
            bars.push(bar);
        }
    }
    return bars;
}

const timeIntervalToTimeRangeLimitMap = {
    days: twelveMonthsMs,
    hours: oneMonthMs,
    minutes: oneDayMs,
} as const;

/**
 * Constructs an instrument for the Amberdata API using the canonical exchange of a token
 *
 * @param mint - The mint address of the token
 * @returns A tuple of canonical exchange and pair composed of the canonical ticker's ticker and default quote
 */
export function getPriceChartInfo(mint: `0x${string}`) {
    const token = resolveAddress(mint);
    if (token.ticker === USDT_TICKER) {
        return {
            exchange: "BINANCE",
            instrument: "usdc_usdt",
            ticker: token.getCanonicalExchangeTicker(),
        } as const;
    }
    const canonicalExchange = token.canonicalExchange.toUpperCase().toUpperCase();
    const canonicalTicker = token.getCanonicalExchangeTicker();
    const defaultQuote = getQuoteTicker(mint);
    const instrument = `${canonicalTicker}_${defaultQuote}`.toLowerCase();
    return {
        exchange: canonicalExchange,
        instrument,
        ticker: canonicalTicker,
    } as const;
}

/**
 * Returns Amberdata specific quote ticker for a given mint
 */
const getQuoteTicker = (mint: `0x${string}`) => {
    const token = resolveAddress(mint);
    const canonicalExchange = token.canonicalExchange;
    if (["coinbase", "kraken"].includes(canonicalExchange)) {
        return "usd";
    }
    return getDefaultQuote(mint, canonicalExchange).ticker;
};

/**
 * Maps internal exchange names to Amberdata exchange names
 *
 * Capitalized because this is rendered in the TradingView chart
 */
export function exchangeToAmberdataExchange(exchange: string) {
    switch (exchange) {
        case "BINANCE":
            return "binance";
        case "COINBASE":
            return "gdax";
        case "KRAKEN":
            return "kraken";
        case "OKX":
            return "okex";
        default:
            return exchange;
    }
}
