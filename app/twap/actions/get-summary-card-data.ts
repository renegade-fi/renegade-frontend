import type z from "zod";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";

interface TwapSummary {
    cumulativeDeltaBps: number;
    binanceFeeBps: number;
    renegadeFeeBps: number;
    cumulativeSold: number;
    cumulativeRenegadeReceived: number;
    cumulativeBinanceReceived: number;
    soldTicker: string;
    receivedTicker: string;
    averagePriceBinance: number;
    averagePriceRenegade: number;
    totalSize: number; // Requested USDC amount
    executedSize: number; // Cumulative USDC traded
}

// Unified type for summary card containing all needed data
export interface TwapSummaryCardData {
    summary: TwapSummary;
    numTrades: number;
    startTime: string;
    endTime: string;
}

// Transform raw simulation data to summary card display data
export function getSummaryCardData(
    simData: z.output<typeof SimulateTwapResponseSchema>,
    twapParams: TwapParams,
): TwapSummaryCardData {
    // Resolve tokens from twapParams
    const baseToken = twapParams.getBaseToken();
    const quoteToken = twapParams.getQuoteToken();
    if (!baseToken || !quoteToken) {
        throw new Error("Base or quote token not found");
    }

    const direction = twapParams.getDirection();

    // Get strategies
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) {
        throw new Error("Renegade or Binance strategy not found");
    }

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

    // Get sold amount (raw) - same for both strategies
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
            ? cumulativeSold !== 0
                ? cumulativeSold / binanceReceived
                : 0
            : binanceReceived !== 0
              ? binanceReceived / cumulativeSold
              : 0;

    const averagePriceRenegade =
        direction === "Buy"
            ? cumulativeSold !== 0
                ? cumulativeSold / renegadeReceived
                : 0
            : renegadeReceived !== 0
              ? renegadeReceived / cumulativeSold
              : 0;

    // Calculate total size (requested USDC) and executed size (cumulative USDC traded)
    const totalSize = formatUnitsToNumber(twapParams.data.quote_amount, quoteToken.decimals);
    const executedSize = formatUnitsToNumber(
        renegade.summary.total_quote_amount,
        quoteToken.decimals,
    );

    const summary: TwapSummary = {
        averagePriceBinance,
        averagePriceRenegade,
        binanceFeeBps,
        cumulativeBinanceReceived: binanceReceived,
        cumulativeDeltaBps,
        cumulativeRenegadeReceived: renegadeReceived,
        cumulativeSold,
        executedSize,
        receivedTicker: receivedToken.ticker,
        renegadeFeeBps,
        soldTicker: soldToken.ticker,
        totalSize,
    };

    return {
        endTime: twapParams.data.end_time,
        numTrades: twapParams.data.num_trades,
        startTime: twapParams.data.start_time,
        summary,
    };
}
