import type z from "zod";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";

// Data for the price comparison table
export interface TwapPriceTableData {
    averagePriceBinance: number;
    averagePriceRenegade: number;
    cumulativeBinanceReceived: number;
    cumulativeRenegadeReceived: number;
    cumulativeDeltaBps: number;
    receivedTicker: string;
}

// Extract price comparison data between strategies
export function getPriceTableData(
    simData: z.output<typeof SimulateTwapResponseSchema>,
    twapParams: TwapParams,
): TwapPriceTableData {
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

    return {
        averagePriceBinance,
        averagePriceRenegade,
        cumulativeBinanceReceived: binanceReceived,
        cumulativeDeltaBps,
        cumulativeRenegadeReceived: renegadeReceived,
        receivedTicker: receivedToken.ticker,
    };
}
