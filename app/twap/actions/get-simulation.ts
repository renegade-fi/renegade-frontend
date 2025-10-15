"use server";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import dayjs from "dayjs";
import type z from "zod";
import { formatNumber, formatTimestampReadable } from "@/lib/format";
import { DEFAULT_BINANCE_FEE } from "../lib/binance-fee-tiers";
import type { TwapTableData } from "../lib/table-types";
import { findTokenByTicker } from "../lib/token-utils";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapTradeResult } from "../lib/twap-server-client/api-types/twap";
import {
    TwapParams,
    TwapParamsSchema,
    TwapUrlParamsSchema,
} from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";
import { twapLoader } from "../server/loader";

export type SearchParams = { [key: string]: string | string[] | undefined };

interface TwapSummary {
    cumulativeDeltaBps: number; // renamed from cumDeltaBps for clarity
    binanceFeeBps: number;
    renegadeFeeBps: number;
    // Cumulative totals (decimal)
    cumulativeSold: number; // same for both strategies
    cumulativeRenegadeReceived: number;
    cumulativeBinanceReceived: number;
    // Labels
    soldTicker: string;
    receivedTicker: string;
    // Average prices (USDC per base)
    averagePriceBinance: number;
    averagePriceRenegade: number;
}

interface TwapRequestSummary {
    numTrades: number;
    startTime: string; // ISO
    endTime: string; // ISO
    direction: "Buy" | "Sell";
    sendTicker: string;
    receiveTicker: string;
}

export async function getSimulation(searchParams: SearchParams): Promise<{
    baseMint?: string;
    simData: z.output<typeof SimulateTwapResponseSchema> | null;
    table: TwapTableData | null;
    summary: TwapSummary | null;
    request: TwapRequestSummary | null;
    error?: string;
}> {
    const urlResult = TwapUrlParamsSchema.safeParse(searchParams);
    if (!urlResult.success) {
        return { baseMint: undefined, request: null, simData: null, summary: null, table: null };
    }

    const { data } = urlResult;

    const baseToken = findTokenByTicker(data.base_ticker);
    const quoteToken = baseToken
        ? Token.fromTickerOnChain("USDC", baseToken.chain as ChainId)
        : undefined;
    if (!baseToken || !quoteToken) {
        return { baseMint: undefined, request: null, simData: null, summary: null, table: null };
    }

    const serverParams = TwapParamsSchema.parse({
        base_amount: "0", // Always use quote_amount, ignore base_amount from URL
        base_mint: baseToken.address,
        direction: data.direction,
        end_time: data.end_time,
        num_trades: data.num_trades,
        quote_amount: data.quote_amount,
        quote_mint: quoteToken.address,
        start_time: data.start_time,
    });

    const feeParam = searchParams.binance_taker_bps as string | undefined;
    const binanceFee = feeParam ? Number(feeParam) : DEFAULT_BINANCE_FEE;

    // Build request summary from validated params and tokens
    const sendTicker = data.direction === "Buy" ? quoteToken.ticker : baseToken.ticker;
    const receiveTicker = data.direction === "Buy" ? baseToken.ticker : quoteToken.ticker;
    const request: TwapRequestSummary = {
        direction: data.direction,
        endTime: data.end_time,
        numTrades: data.num_trades,
        receiveTicker,
        sendTicker,
        startTime: data.start_time,
    };

    try {
        const simData = await twapLoader(TwapParams.new(serverParams), undefined, {
            binance_fee: binanceFee,
        });

        // Process table data
        const table = processTableData(simData, baseToken, quoteToken);

        // Compute summary metrics
        const summary = computeSummaryMetrics(
            simData,
            serverParams.direction,
            baseToken,
            quoteToken,
        );

        return { baseMint: serverParams.base_mint, request, simData, summary, table };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load simulation";
        return {
            baseMint: serverParams.base_mint,
            error: errorMessage,
            request,
            simData: null,
            summary: null,
            table: null,
        };
    }
}

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

function processTableData(
    simData: z.output<typeof SimulateTwapResponseSchema> | null,
    baseToken: any,
    quoteToken: any,
): TwapTableData | null {
    if (!simData || !baseToken || !quoteToken) return null;

    // Get strategies
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) return null;

    // Get direction from first trade
    const firstTrade = renegade.sim_result.trades[0];
    if (!firstTrade) return null;
    const direction = firstTrade.direction;

    // Compute sendTicker and receiveTicker based on direction
    const sendTicker = direction === "Buy" ? quoteToken.ticker : baseToken.ticker;
    const receiveTicker = direction === "Buy" ? baseToken.ticker : quoteToken.ticker;

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
    const sortedRows = rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return {
        meta: {
            direction,
            receiveTicker,
            sendTicker,
        },
        rows: sortedRows,
    };
}

function computeSummaryMetrics(
    simData: z.output<typeof SimulateTwapResponseSchema> | null,
    direction: "Buy" | "Sell",
    baseToken: any,
    quoteToken: any,
): TwapSummary | null {
    if (!simData || !baseToken || !quoteToken) return null;

    // Get strategies
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) return null;

    // Determine sold/received tokens and decimals based on direction
    const soldToken = direction === "Buy" ? quoteToken : baseToken;
    const receivedToken = direction === "Buy" ? baseToken : quoteToken;
    const soldDecimals = soldToken.decimals;
    const receivedDecimals = receivedToken.decimals;

    // Get received amounts (raw) - these differ between strategies
    const renegadeReceivedAmount =
        direction === "Buy"
            ? renegade.summary.total_base_amount
            : renegade.summary.total_quote_amount;
    const binanceReceivedAmount =
        direction === "Buy"
            ? binance.summary.total_base_amount
            : binance.summary.total_quote_amount;

    // Get sold amount (raw) - this is the same for both strategies
    const soldAmount =
        direction === "Buy"
            ? renegade.summary.total_quote_amount
            : renegade.summary.total_base_amount;

    // Convert to numbers
    const renegadeReceived = formatUnitsToNumber(renegadeReceivedAmount, receivedDecimals);
    const binanceReceived = formatUnitsToNumber(binanceReceivedAmount, receivedDecimals);
    const cumulativeSold = formatUnitsToNumber(soldAmount, soldDecimals);

    // Calculate cumulative delta bps (guard against divide by zero)
    const cumulativeDeltaBps =
        binanceReceived !== 0
            ? ((renegadeReceived - binanceReceived) / binanceReceived) * 10000
            : 0;

    // Convert fees from decimal fractions to bps
    const renegadeFeeBps = Number(renegade.summary.fee) * 10000;
    const binanceFeeBps = Number(binance.summary.fee) * 10000;

    // Calculate average prices (always USDC per base)
    const averagePriceBinance =
        direction === "Buy"
            ? cumulativeSold !== 0 ? cumulativeSold / binanceReceived : 0
            : binanceReceived !== 0 ? binanceReceived / cumulativeSold : 0;
    
    const averagePriceRenegade =
        direction === "Buy"
            ? cumulativeSold !== 0 ? cumulativeSold / renegadeReceived : 0
            : renegadeReceived !== 0 ? renegadeReceived / cumulativeSold : 0;

    return {
        averagePriceBinance,
        averagePriceRenegade,
        binanceFeeBps,
        cumulativeBinanceReceived: binanceReceived,
        cumulativeDeltaBps,
        cumulativeRenegadeReceived: renegadeReceived,
        cumulativeSold,
        receivedTicker: receivedToken.ticker,
        renegadeFeeBps,
        soldTicker: soldToken.ticker,
    };
}
