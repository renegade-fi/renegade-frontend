import type { Bar } from "@renegade-fi/tradingview-charts";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { exchangeToAmberdataExchange, fetchBars, getPriceChartInfo } from "@/lib/amberdata";

export function useOHLC(options: {
    mint: `0x${string}`;
    startDateMs: number;
    endDateMs: number;
    timeInterval: "minutes" | "hours" | "days";
    invert?: boolean;
}): UseQueryResult<Bar[], unknown> {
    return useQuery({
        queryFn: () => queryFn(options),
        queryKey: ["ohlc", options],
        retry: false,
    });
}

function queryFn(options: {
    mint: `0x${string}`;
    startDateMs: number;
    endDateMs: number;
    timeInterval: "minutes" | "hours" | "days";
    invert?: boolean;
}) {
    const info = getPriceChartInfo(options.mint);
    const exchange = info.exchange.toString();

    const amberdataExchange = exchangeToAmberdataExchange(exchange);

    return fetchBars({
        endDateMs: options.endDateMs,
        exchange: amberdataExchange,
        instrument: info.instrument,
        startDateMs: options.startDateMs,
        timeInterval: options.timeInterval,
    }).then((bars) => {
        return options.invert ? invertBarData(bars) : bars;
    });
}

/**
 * Inverts price-related fields in Bar data using 1/price transformation
 */
function invertBarData(bars: Bar[]): Bar[] {
    return bars.map((bar) => ({
        ...bar,
        close: 1 / bar.close,
        high: 1 / bar.low, // High becomes inverted low
        low: 1 / bar.high, // Low becomes inverted high
        open: 1 / bar.open,
    }));
}
