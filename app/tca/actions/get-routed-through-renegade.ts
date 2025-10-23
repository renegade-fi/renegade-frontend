import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";

// Data for Routed Through Renegade Chart
export interface RoutedThroughRenegadeChartData {
    renegadeFillPercent: number;
    totalSize: number;
}

export function getRoutedThroughRenegadeChartData(
    simData: TwapSimulation,
    twapParams: TwapParams,
): RoutedThroughRenegadeChartData {
    const renegadeFillPercent = simData.renegadeFillPercent();
    const totalSize = twapParams.decimalCorrectedQuoteAmount();

    return {
        renegadeFillPercent: renegadeFillPercent ?? 0,
        totalSize,
    };
}
