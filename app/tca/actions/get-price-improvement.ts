import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";

// Data for the price improvement card
export interface PriceImprovementData {
    cumulativeBinanceReceived: number;
    cumulativeRenegadeReceived: number;
    cumulativeDeltaBps: number;
    receivedTicker: string;
}

// Extract price comparison data between strategies
export function getPriceImprovementData(
    simData: TwapSimulation,
    twapParams: TwapParams,
): PriceImprovementData {
    const receiveToken = twapParams.receiveToken();

    // Get received amounts
    const renegadeReceivedAmount = simData.receivedAmount("Renegade");
    const binanceReceivedAmount = simData.receivedAmount("Binance");

    // Convert to numbers
    const renegadeReceived = receiveToken.convertToDecimal(BigInt(renegadeReceivedAmount));
    const binanceReceived = receiveToken.convertToDecimal(BigInt(binanceReceivedAmount));

    // Calculate cumulative delta bps (guard against divide by zero)
    const cumulativeDeltaBps =
        binanceReceived !== 0
            ? ((renegadeReceived - binanceReceived) / binanceReceived) * 10000
            : 0;

    return {
        cumulativeBinanceReceived: binanceReceived,
        cumulativeDeltaBps,
        cumulativeRenegadeReceived: renegadeReceived,
        receivedTicker: receiveToken.ticker,
    };
}
