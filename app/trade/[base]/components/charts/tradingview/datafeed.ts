import type { Bar, IBasicDataFeed, LibrarySymbolInfo } from "@renegade-fi/tradingview-charts";

import { getPriceChartInfo } from "@/lib/amberdata";
import { client as priceReporterClient } from "@/lib/clients/price-reporter";
import { oneDayMs, oneMonthMs, twelveMonthsMs } from "@/lib/constants/time";

import { datafeedConfig } from "./config";
import { fetchBarsForPeriod } from "./helpers";

const lastBarsCache = new Map();

// Calculate pricescale based on price to show 2 significant figures with minimum 2 decimals
function calculatePricescale(price: number): number {
    const decimalsNeeded = Math.max(2, -Math.floor(Math.log10(price)) + 1);
    return 10 ** decimalsNeeded;
}

export const datafeed = {
    onReady: (callback: any) => {
        setTimeout(() => callback(datafeedConfig));
    },
    searchSymbols: async (_userInput, _exchange, _symbolType, onResultReadyCallback) => {
        // Not implemented because search is disabled
        onResultReadyCallback([]);
    },
    resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback,
        _extension,
    ) => {
        try {
            const mint = symbolName as `0x${string}`;
            const info = getPriceChartInfo(mint);
            const exchange = info.exchange.toString();
            const pair = info.instrument.split("_").join("").toUpperCase();

            // Fetch current price to calculate appropriate pricescale
            let pricescale = 100; // Default fallback
            try {
                const price = await priceReporterClient.getPrice(mint);
                if (price && price > 0) {
                    pricescale = calculatePricescale(price);
                }
            } catch {
                // Do nothing
            }

            const symbolInfo = {
                data_status: "streaming",
                description: pair,
                exchange,
                format: "price",
                has_intraday: true,
                intraday_multipliers: ["1", "60"],
                has_daily: true,
                daily_multipliers: ["1"],
                has_weekly_and_monthly: false,
                listed_exchange: "",
                minmov: 1,
                name: pair,
                pricescale,
                session: "24x7",
                supported_resolutions: datafeedConfig.supported_resolutions,
                ticker: info.instrument,
                timezone: "Etc/UTC",
                type: "crypto",
                volume_precision: 2,
            } satisfies LibrarySymbolInfo;

            onSymbolResolvedCallback(symbolInfo);
        } catch (_error) {
            onResolveErrorCallback("cannot resolve symbol");
        }
    },
    async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
        const { from, to, firstDataRequest, countBack } = periodParams;

        try {
            const resolutionSettings: {
                [key: string]: { period: string; duration: number };
            } = {
                "1": { period: "minutes", duration: oneDayMs },
                "60": { period: "hours", duration: oneMonthMs },
                "1D": { period: "days", duration: twelveMonthsMs },
            };

            let bars: Bar[] = [];
            const settings = resolutionSettings[resolution];
            if (settings && symbolInfo.ticker) {
                bars = await fetchBarsForPeriod(
                    symbolInfo.ticker,
                    symbolInfo.exchange,
                    from * 1000,
                    to * 1000,
                    settings.period,
                    countBack,
                );
            } else {
                throw new Error(
                    `Missing ticker (${symbolInfo.ticker}) or resolution (${resolution})`,
                );
            }

            // Caching
            if (firstDataRequest) {
                lastBarsCache.set(symbolInfo.name, {
                    ...bars[bars.length - 1],
                });
            }

            onHistoryCallback(bars, {
                noData: false,
            });
        } catch (error) {
            if (error === "NoData") {
                onHistoryCallback([], {
                    noData: true,
                });
            } else {
                onErrorCallback(`${error}`);
            }
        }
    },
    subscribeBars: (
        _symbolInfo,
        _resolution,
        _onRealtimeCallback,
        _subscriberUID,
        _onResetCacheNeededCallback,
    ) => {
        // TODO: Fix Amberdata WS proxy
    },

    unsubscribeBars: (_subscriberUID) => {
        // TODO: Fix Amberdata WS proxy
    },
} satisfies IBasicDataFeed;
