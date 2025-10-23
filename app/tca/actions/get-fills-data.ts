import dayjs from "dayjs";
import { formatTimestampReadable } from "@/lib/format";
import type { TwapTableMeta, TwapTableRow } from "../lib/table-types";
import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams, TwapTradeResult } from "../lib/twap-server-client/api-types/twap";

function buildRows(
    tradeMap: Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>,
    twapParams: TwapParams,
) {
    const rows = [];

    const direction = twapParams.direction();

    // Capture the first timestamp as the TWAP start time
    const startTime = tradeMap.keys().next().value || "";
    let previousTimestamp: string | null = null;

    for (const [timestamp, { renegade: renegadeTrade, binance: binanceTrade }] of tradeMap) {
        if (!renegadeTrade || !binanceTrade) continue;

        // Calculate time differences
        const diffMs = dayjs(timestamp).diff(dayjs(startTime));
        const timeSinceStart = formatTimestampReadable(diffMs);

        let timeSincePrevious: string | null = null;
        if (previousTimestamp) {
            const timeDiffMs = dayjs(timestamp).diff(dayjs(previousTimestamp));
            timeSincePrevious = formatTimestampReadable(timeDiffMs);
        }

        // Use TwapTradeResult methods for formatted amounts and prices
        const sendAmountFormatted = renegadeTrade.formattedSendAmount();
        const receiveBinanceFormatted = binanceTrade.formattedReceiveAmount();
        const receiveRenegadeFormatted = renegadeTrade.formattedReceiveAmount();
        const priceBinanceFormatted = binanceTrade.formattedPrice();
        const priceBinanceAndRenegadeFormatted = renegadeTrade.formattedPrice();

        // Calculate delta bps - direction matters for interpretation
        // Sell: higher Renegade price = better (positive)
        // Buy: lower Renegade price = better (positive)
        const priceBinance = binanceTrade.price();
        const priceBinanceAndRenegade = renegadeTrade.price();
        const priceDiff = priceBinanceAndRenegade - priceBinance;
        const deltaBpsNum =
            priceBinance !== 0
                ? ((direction === "Sell" ? priceDiff : -priceDiff) / priceBinance) * 10000
                : 0;

        const deltaBpsFormatted = `${deltaBpsNum.toFixed(2)}`;

        rows.push({
            deltaBps: deltaBpsFormatted,
            priceBinance: priceBinanceFormatted,
            priceBinanceAndRenegade: priceBinanceAndRenegadeFormatted,
            receiveBinance: receiveBinanceFormatted,
            receiveRenegade: receiveRenegadeFormatted,
            sendAmount: sendAmountFormatted,
            time: timestamp,
            timeSincePrevious,
            timeSinceStart,
        });

        previousTimestamp = timestamp;
    }

    return rows;
}

// Get table metadata
export function getMetadata(twapParams: TwapParams): TwapTableMeta {
    const direction = twapParams.direction();

    // Compute sendTicker and receiveTicker based on direction
    const sendTicker = twapParams.sendToken().ticker;
    const receiveTicker = twapParams.receiveToken().ticker;

    return {
        direction,
        receiveTicker,
        sendTicker,
    };
}

// Get table rows
export function getRows(simData: TwapSimulation, twapParams: TwapParams): TwapTableRow[] {
    // Get merged trades by timestamp using new method
    const mergedTrades = simData.mergedTradesByTimestamp();

    // Convert to old format for buildRows (can be refactored later)
    const tradeMap = new Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>();
    for (const [timestamp, strategyMap] of mergedTrades) {
        tradeMap.set(timestamp, {
            binance: strategyMap.get("Binance"),
            renegade: strategyMap.get("Renegade"),
        });
    }

    // Build rows for timestamps present in both strategies
    const rows = buildRows(tradeMap, twapParams);
    return rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
