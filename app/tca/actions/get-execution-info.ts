import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";

// Data for the info/details table
export interface ExecutionInfo {
    asset: string;
    direction: "Buy" | "Sell";
    totalSize: number;
    numTrades: number;
    startTime: string;
    endTime: string;
    renegadeFeeBps: number;
}

// Extract basic execution details and metadata
export function getExecutionInfo(simData: TwapSimulation, twapParams: TwapParams): ExecutionInfo {
    const baseToken = twapParams.baseToken();
    const direction = simData.direction();

    const totalSize = twapParams.decimalCorrectedQuoteAmount();
    const renegadeFeeBps = simData.renegadeFeeInBps();

    return {
        asset: baseToken.ticker,
        direction,
        endTime: twapParams.data.end_time,
        numTrades: twapParams.data.num_trades,
        renegadeFeeBps,
        startTime: twapParams.data.start_time,
        totalSize,
    };
}
