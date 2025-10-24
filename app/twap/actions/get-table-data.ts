import dayjs from "dayjs";
import type z from "zod";
import { formatNumber, formatTimestampReadable } from "@/lib/format";
import type { TwapTableMeta, TwapTableRow } from "../lib/table-types";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams, TwapTradeResult } from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";

function buildRows(
    tradeMap: Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>,
    direction: "Buy" | "Sell",
    baseToken: any,
    quoteToken: any,
) {
    const rows = [];

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

        // Send amount depends on direction
        // For Buy: USDC sold (quote amount)
        // For Sell: base token sold (base amount)
        const sendAmount =
            direction === "Buy" ? renegadeTrade.quote_amount : renegadeTrade.base_amount;
        const sendDecimals = direction === "Buy" ? quoteToken.decimals : baseToken.decimals;

        // Get absolute value and format
        const sendAmountFormatted = formatNumber(
            BigInt(Math.abs(Number(sendAmount))),
            sendDecimals,
            true,
        );

        // Receive amounts depend on direction
        const binanceReceive =
            direction === "Buy" ? binanceTrade.base_amount : binanceTrade.quote_amount;
        const renegadeReceive =
            direction === "Buy" ? renegadeTrade.base_amount : renegadeTrade.quote_amount;
        const receiveDecimals = direction === "Buy" ? baseToken.decimals : quoteToken.decimals;

        const binanceReceiveFormatted = formatNumber(
            BigInt(Math.abs(Number(binanceReceive))),
            receiveDecimals,
            true,
        );

        const renegadeReceiveFormatted = formatNumber(
            BigInt(Math.abs(Number(renegadeReceive))),
            receiveDecimals,
            true,
        );

        // Calculate delta bps numerically then format as string
        const binanceReceiveNum = formatUnitsToNumber(binanceReceive, receiveDecimals);
        const renegadeReceiveNum = formatUnitsToNumber(renegadeReceive, receiveDecimals);

        const deltaBpsNum =
            binanceReceiveNum !== 0
                ? ((renegadeReceiveNum - binanceReceiveNum) / binanceReceiveNum) * 10000
                : 0;

        const deltaBpsFormatted = `${deltaBpsNum.toFixed(2)}`;

        rows.push({
            deltaBps: deltaBpsFormatted,
            receiveAmountBinance: binanceReceiveFormatted,
            receiveAmountRenegade: renegadeReceiveFormatted,
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
export function getTableMeta(
    simData: z.output<typeof SimulateTwapResponseSchema>,
    twapParams: TwapParams,
): TwapTableMeta {
    // Resolve tokens from twapParams
    const baseToken = twapParams.getBaseToken();
    const quoteToken = twapParams.getQuoteToken();
    if (!baseToken || !quoteToken) {
        throw new Error("Base or quote token not found");
    }

    // Get direction from twapParams
    const direction = twapParams.getDirection();

    // Compute sendTicker and receiveTicker based on direction
    const sendTicker = twapParams.getSendTicker(baseToken, quoteToken);
    const receiveTicker = twapParams.getReceiveTicker(baseToken, quoteToken);

    return {
        direction,
        receiveTicker,
        sendTicker,
    };
}

// Get table rows
export function getTableRows(
    simData: z.output<typeof SimulateTwapResponseSchema>,
    twapParams: TwapParams,
): TwapTableRow[] {
    // Resolve tokens from twapParams
    const baseToken = twapParams.getBaseToken();
    const quoteToken = twapParams.getQuoteToken();
    if (!baseToken || !quoteToken) {
        throw new Error("Base or quote token not found");
    }

    // Get direction from twapParams
    const direction = twapParams.getDirection();

    // Get strategies
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) {
        throw new Error("Renegade or Binance strategy not found");
    }

    // Merge trades by timestamp
    const renegadeTrades = [...renegade.sim_result.trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const binanceTrades = [...binance.sim_result.trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const tradeMap = new Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>();

    for (const trade of renegadeTrades) {
        const existing = tradeMap.get(trade.timestamp) || {};
        existing.renegade = trade;
        tradeMap.set(trade.timestamp, existing);
    }

    for (const trade of binanceTrades) {
        const existing = tradeMap.get(trade.timestamp) || {};
        existing.binance = trade;
        tradeMap.set(trade.timestamp, existing);
    }

    // Build rows for timestamps present in both strategies
    const rows = buildRows(tradeMap, direction, baseToken, quoteToken);
    return rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}
