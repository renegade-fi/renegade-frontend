import z from "zod";
import { TwapStrategySchema } from "./index";
import {
    TwapOptionsSchema,
    TwapParamsSchema,
    TwapSimulationResultSchema,
    TwapSimulationSummarySchema,
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
    sim_result: TwapSimulationResultSchema,
    strategy: TwapStrategySchema,
    summary: TwapSimulationSummarySchema,
});

export const SimulateTwapResponseSchema = z.object({
    strategies: z.array(TwapStrategySimulationResultSchema),
});

export type SimulateTwapResponse = z.infer<typeof SimulateTwapResponseSchema>;
