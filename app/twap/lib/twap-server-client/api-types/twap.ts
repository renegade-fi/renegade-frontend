import z from "zod";
import { zHexString } from "@/env/schema";
import { resolveAddress } from "@/lib/token";
import { QuoteDirectionSchema } from "./index";
import type { TwapStrategy } from "./request-response";

// A TWAP parameterization
export const TwapParamsSchema = z
    .object({
        // The base amount traded in the TWAP
        base_amount: z.string(),
        // The base mint to simulate a TWAP for
        base_mint: zHexString,
        // The direction of the TWAP
        direction: QuoteDirectionSchema,
        // The end time of the TWAP
        end_time: z.iso.datetime(),
        // The number of trades to break the TWAP into
        num_trades: z.coerce.number().int().positive(),
        // The quote amount traded in the TWAP (optional alternative to base_amount)
        quote_amount: z.string().default("0"),
        // The quote mint to simulate a TWAP for
        quote_mint: zHexString,
        // The start time of the TWAP
        start_time: z.iso.datetime(),
    })
    .superRefine((data, ctx) => {
        // quote_amount must always be non-zero (base_amount is always zero now)
        const quoteIsZero = Number.parseFloat(data.quote_amount ?? "0") === 0;
        if (quoteIsZero) {
            ctx.addIssue({
                code: "custom",
                message: "quote_amount must be non-zero",
                path: ["quote_amount"],
            });
        }
    });

export const TwapOptionsSchema = z.object({
    binance_fee: z.number(),
});

// URL-level schema where we accept tickers instead of addresses
export const TwapUrlParamsSchema = z.object({
    base_amount: z.string().optional().default("0"), // Ignored, always use quote_amount
    base_ticker: z.string(),
    direction: QuoteDirectionSchema,
    end_time: z.iso.datetime(),
    num_trades: z.coerce.number().int().positive(),
    quote_amount: z.string().default("0"),
    start_time: z.iso.datetime(),
});

export class TwapParams {
    constructor(public data: z.infer<typeof TwapParamsSchema>) {}
    static new(data: z.infer<typeof TwapParamsSchema>) {
        return new TwapParams(data);
    }

    // Returns an object matching the SimulateTwapRequestSchema shape
    toSimulateRequest(
        strategies: TwapStrategy[],
        options: z.infer<typeof TwapOptionsSchema>,
    ): {
        params: z.infer<typeof TwapParamsSchema>;
        strategies: TwapStrategy[];
        options: z.infer<typeof TwapOptionsSchema>;
    } {
        return { options: options, params: this.data, strategies };
    }

    // Get direction from params
    getDirection(): "Buy" | "Sell" {
        return this.data.direction;
    }

    // Get the ticker being sent based on direction
    getSendTicker(baseToken: any, quoteToken: any): string {
        return this.data.direction === "Buy" ? quoteToken.ticker : baseToken.ticker;
    }

    // Get the ticker being received based on direction
    getReceiveTicker(baseToken: any, quoteToken: any): string {
        return this.data.direction === "Buy" ? baseToken.ticker : quoteToken.ticker;
    }

    // Resolve base token from mint
    getBaseToken() {
        return resolveAddress(this.data.base_mint);
    }

    // Resolve quote token from mint
    getQuoteToken() {
        return resolveAddress(this.data.quote_mint);
    }
}

// The result of a TWAP trade
export const TwapTradeResultSchema = z.object({
    // The base amount of the trade
    base_amount: z.string(),
    // The base mint of the trade
    base_mint: zHexString,
    // The direction of the trade
    direction: QuoteDirectionSchema,
    // The quote amount of the trade
    quote_amount: z.string(),
    // The quote mint of the trade
    quote_mint: zHexString,
    // The timestamp of the trade
    timestamp: z.iso.datetime(),
});

// The result of a TWAP simulation
export const TwapSimulationResultSchema = z.object({
    // The trades that were simulated
    trades: z.array(TwapTradeResultSchema),
});

// A summary of a TWAP simulation
export const TwapSimulationSummarySchema = z.object({
    // The fee applied to the TWAP
    fee: z.string(),
    // The total output amount of the TWAP (base)
    total_base_amount: z.string(),
    // The total input amount of the TWAP (quote)
    total_quote_amount: z.string(),
});

export type TwapParamsData = z.infer<typeof TwapParamsSchema>;
export type TwapTradeResult = z.infer<typeof TwapTradeResultSchema>;
export type TwapSimulationResult = z.infer<typeof TwapSimulationResultSchema>;
