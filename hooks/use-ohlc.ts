import type { Bar } from "@renegade-fi/tradingview-charts";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import { exchangeToAmberdataExchange, fetchBars, getPriceChartInfo } from "@/lib/amberdata";

export function useOHLC(options: {
    mint: `0x${string}`;
    startDateMs: number;
    endDateMs: number;
    timeInterval: "minutes" | "hours" | "days";
}): UseQueryResult<Bar[], unknown> {
    return useQuery({
        queryKey: ["ohlc", options],
        queryFn: () => queryFn(options),
        retry: false,
    });
}

function queryFn(options: {
    mint: `0x${string}`;
    startDateMs: number;
    endDateMs: number;
    timeInterval: "minutes" | "hours" | "days";
}) {
    const info = getPriceChartInfo(options.mint);
    const exchange = info.exchange.toString();

    const amberdataExchange = exchangeToAmberdataExchange(exchange);

    return fetchBars({
        instrument: info.instrument,
        startDateMs: options.startDateMs,
        endDateMs: options.endDateMs,
        timeInterval: options.timeInterval,
        exchange: amberdataExchange,
    });
}
