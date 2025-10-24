import type z from "zod";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapParams } from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";

// Data for the info/details table
export interface TwapInfoTableData {
    asset: string;
    direction: "Buy" | "Sell";
    totalSize: number;
    numTrades: number;
    startTime: string;
    endTime: string;
    renegadeFeeBps: number;
}

// Extract basic execution details and metadata
export function getInfoTableData(
    simData: z.output<typeof SimulateTwapResponseSchema>,
    twapParams: TwapParams,
): TwapInfoTableData {
    const baseToken = twapParams.getBaseToken();
    const quoteToken = twapParams.getQuoteToken();
    if (!baseToken || !quoteToken) {
        throw new Error("Base or quote token not found");
    }

    const direction = twapParams.getDirection();

    // Get Renegade strategy for fee calculation
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    if (!renegade) {
        throw new Error("Renegade strategy not found");
    }

    // Calculate total size (in USDC/quote token)
    const totalSize = formatUnitsToNumber(twapParams.data.quote_amount, quoteToken.decimals);

    // Convert fee from decimal fraction to bps
    const renegadeFeeBps = Number(renegade.summary.fee) * 10000;

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
