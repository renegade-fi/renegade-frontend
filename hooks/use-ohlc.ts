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
    });
}
