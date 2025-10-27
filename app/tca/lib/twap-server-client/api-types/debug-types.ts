import z from "zod";
import { TwapStrategySchema } from "./index";
import { TwapSimulationSummarySchema, TwapTradeResultSchema } from "./twap";

// DEBUG SCHEMA - Delete when debugging complete
/**
 * Extended schemas for debugging price interpolation.
 *
 * Example output structure:
 * {
 *   "strategies": [{
 *     "strategy": "Binance",
 *     "summary": { ... },
 *     "sim_result": {
 *       "trades": [
 *         {
 *           "base_mint": "0x...",
 *           "quote_mint": "0x...",
 *           "direction": "Buy",
 *           "base_amount": "1000000",
 *           "quote_amount": "2500000000",
 *           "timestamp": "2024-01-15T10:30:00Z",
 *           "interpolated_price": "2500.0",
 *           "neighbors": [
 *             {
 *               "timestamp": "2024-01-15T10:29:45Z",
 *               "venue": "binance",
 *               "direction": "buy",
 *               "distance": "15.0",
 *               "in_volume": "2500000000",
 *               "out_volume": "1000500",
 *               "price": "2501.25",
 *               "weight": "0.45"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   }]
 * }
 */
// Neighbor data point used in price interpolation
export const DebugNeighborSchema = z.object({
    // Trade direction
    direction: z.string(),
    // Time distance from the interpolated trade (seconds)
    distance: z.string(),
    // Volume of input token (e.g. USDC for buy)
    in_volume: z.string(),
    // Volume of output token (e.g. ETH for buy)
    out_volume: z.string(),
    // Calculated price (out_volume / in_volume)
    price: z.string(),
    // Timestamp of the historic trade
    timestamp: z.string(),
    // Trading venue (e.g. "binance", "renegade")
    venue: z.string(),
    // Weight applied in interpolation (0-1)
    weight: z.string(),
});

// DEBUG: Extended trade result with interpolation details
export const DebugTwapTradeResultSchema = TwapTradeResultSchema.extend({
    // Price used for this trade after interpolation
    interpolated_price: z.string(),
    // All historic data points used for interpolation
    neighbors: z.array(DebugNeighborSchema),
});

// DEBUG: Extended simulation result with debug trades
export const DebugTwapSimulationResultSchema = z.object({
    trades: z.array(DebugTwapTradeResultSchema),
});

// DEBUG: Full strategy result with debug data
export const DebugTwapStrategySimulationResultSchema = z.object({
    renegade_fill_percent: z.number().optional(),
    sim_result: DebugTwapSimulationResultSchema,
    strategy: TwapStrategySchema,
    summary: TwapSimulationSummarySchema,
});

// DEBUG: Full response schema with debug data
export const DebugSimulateTwapResponseSchema = z.object({
    strategies: z.array(DebugTwapStrategySimulationResultSchema),
});

export type DebugNeighbor = z.infer<typeof DebugNeighborSchema>;
export type DebugTwapTradeResult = z.infer<typeof DebugTwapTradeResultSchema>;
export type DebugTwapSimulationResult = z.infer<typeof DebugTwapSimulationResultSchema>;
export type DebugTwapStrategySimulationResult = z.infer<
    typeof DebugTwapStrategySimulationResultSchema
>;
export type DebugSimulateTwapResponse = z.infer<typeof DebugSimulateTwapResponseSchema>;
