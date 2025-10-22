import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";

// Data for the price comparison table
export interface TwapPriceTableData {
    averagePriceBinance: number;
    averagePriceRenegade: number;
    cumulativeBinanceReceived: number;
    cumulativeRenegadeReceived: number;
    cumulativeDeltaBps: number;
    renegadeFillPercent: number | undefined;
    receivedTicker: string;
}

// Extract price comparison data between strategies
export function getPriceTableData(
    simData: TwapSimulation,
    twapParams: TwapParams,
): TwapPriceTableData {
    const sendToken = twapParams.sendToken();
    const receiveToken = twapParams.receiveToken();
    const direction = simData.direction();

    // Get received amounts using direction-aware methods
    const renegadeReceivedAmount = simData.receivedAmount("Renegade");
    const binanceReceivedAmount = simData.receivedAmount("Binance");
    const soldAmount = simData.soldAmount();

    // Convert to numbers
    const renegadeReceived = receiveToken.convertToDecimal(BigInt(renegadeReceivedAmount));
    const binanceReceived = receiveToken.convertToDecimal(BigInt(binanceReceivedAmount));
    const cumulativeSold = sendToken.convertToDecimal(BigInt(soldAmount));

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
        receivedTicker: receiveToken.ticker,
        renegadeFillPercent: simData.renegadeFillPercent(),
    };
}
