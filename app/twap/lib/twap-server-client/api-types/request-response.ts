import z from "zod";
import { TwapStrategySchema } from "./index";
import {
    TwapOptionsSchema,
    TwapParamsSchema,
    TwapSimulationResultSchema,
    TwapSimulationSummarySchema,
    TwapTradeResult,
} from "./twap";

export type TwapStrategy = z.infer<typeof TwapStrategySchema>;

export const SimulateTwapRequestSchema = z
    .object({
        options: TwapOptionsSchema,
        params: TwapParamsSchema,
        strategies: z.array(TwapStrategySchema),
    })
    .transform((data) => {
        const { quote_amount: _ignoredQuoteAmount, ...rest } = data.params as unknown as Record<
            string,
            unknown
        >;
        return {
            ...data,
            params: rest,
        } as unknown as {
            params: Omit<z.infer<typeof TwapParamsSchema>, "quote_amount">;
            strategies: TwapStrategy[];
        };
    });

export const TwapStrategySimulationResultSchema = z.object({
    renegade_fill_percent: z.number().optional(),
    sim_result: TwapSimulationResultSchema,
    strategy: TwapStrategySchema,
    summary: TwapSimulationSummarySchema,
});

export const SimulateTwapResponseSchema = z.object({
    strategies: z.array(TwapStrategySimulationResultSchema),
});

export type SimulateTwapResponse = z.infer<typeof SimulateTwapResponseSchema>;

export class TwapSimulation {
    constructor(public data: SimulateTwapResponse) {}

    static new(data: SimulateTwapResponse) {
        return new TwapSimulation(data);
    }

    // Get strategy data by name
    strategyData(strategy: TwapStrategy) {
        const result = this.data.strategies.find((s) => s.strategy === strategy);
        if (!result) {
            throw new Error(`${strategy} strategy not found`);
        }
        return result;
    }

    // Get Renegade strategy data
    renegadeData() {
        return this.strategyData("Renegade");
    }

    // Get Binance strategy data
    binanceData() {
        return this.strategyData("Binance");
    }

    // Derive direction from trade data
    direction(): "Buy" | "Sell" {
        const firstStrategy = this.data.strategies[0];
        if (!firstStrategy || firstStrategy.sim_result.trades.length === 0) {
            throw new Error("No trades found in simulation");
        }
        return firstStrategy.sim_result.trades[0].direction;
    }

    // Get received amount for a strategy based on direction
    receivedAmount(strategy: TwapStrategy): string {
        const data = this.strategyData(strategy);
        const dir = this.direction();
        return dir === "Buy" ? data.summary.total_base_amount : data.summary.total_quote_amount;
    }

    // Get sold amount (same for all strategies)
    soldAmount(): string {
        const data = this.data.strategies[0];
        if (!data) {
            throw new Error("No strategies found in simulation");
        }
        const dir = this.direction();
        return dir === "Buy" ? data.summary.total_quote_amount : data.summary.total_base_amount;
    }

    // Get chronologically sorted trades for a strategy
    sortedTrades(strategy: TwapStrategy): TwapTradeResult[] {
        const data = this.strategyData(strategy);
        return [...data.sim_result.trades]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((trade) => TwapTradeResult.new(trade));
    }

    // Merge trades from all strategies by timestamp
    mergedTradesByTimestamp(): Map<string, Map<TwapStrategy, TwapTradeResult>> {
        const tradeMap = new Map<string, Map<TwapStrategy, TwapTradeResult>>();

        for (const strategyResult of this.data.strategies) {
            for (const trade of strategyResult.sim_result.trades) {
                let strategyMap = tradeMap.get(trade.timestamp);
                if (!strategyMap) {
                    strategyMap = new Map();
                    tradeMap.set(trade.timestamp, strategyMap);
                }
                strategyMap.set(strategyResult.strategy, TwapTradeResult.new(trade));
            }
        }

        return tradeMap;
    }

    // Get Renegade fee as basis points
    renegadeFeeInBps(): number {
        return Number(this.renegadeData().summary.fee) * 10000;
    }

    // Get Renegade fill percentage
    renegadeFillPercent(): number | undefined {
        return this.renegadeData().renegade_fill_percent;
    }
}
