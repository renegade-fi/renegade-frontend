import z from "zod";
import { zHexString } from "@/env/schema";
import { resolveAddress } from "@/lib/token";
import { formatTokenAmount, formatUSDC } from "../../utils";
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
    direction(): "Buy" | "Sell" {
        return this.data.direction;
    }

    // Resolve base token from mint
    baseToken() {
        return resolveAddress(this.data.base_mint);
    }

    // Resolve quote token from mint
    quoteToken() {
        return resolveAddress(this.data.quote_mint);
    }

    sendToken() {
        return this.data.direction === "Buy" ? this.quoteToken() : this.baseToken();
    }

    receiveToken() {
        return this.data.direction === "Buy" ? this.baseToken() : this.quoteToken();
    }

    quoteAmount() {
        return BigInt(this.data.quote_amount);
    }

    decimalCorrectedQuoteAmount() {
        return this.quoteToken().convertToDecimal(this.quoteAmount());
    }

    baseAmount() {
        return BigInt(this.data.base_amount);
    }

    decimalCorrectedBaseAmount() {
        return this.baseToken().convertToDecimal(this.baseAmount());
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

export class TwapTradeResult {
    constructor(public data: z.infer<typeof TwapTradeResultSchema>) {}

    static new(data: z.infer<typeof TwapTradeResultSchema>) {
        return new TwapTradeResult(data);
    }

    // Token resolution methods
    baseToken() {
        return resolveAddress(this.data.base_mint);
    }

    quoteToken() {
        return resolveAddress(this.data.quote_mint);
    }

    sendToken() {
        return this.data.direction === "Buy" ? this.quoteToken() : this.baseToken();
    }

    receiveToken() {
        return this.data.direction === "Buy" ? this.baseToken() : this.quoteToken();
    }

    // Raw amount methods (as bigint strings)
    sendAmount(): bigint {
        return this.data.direction === "Buy"
            ? BigInt(this.data.quote_amount)
            : BigInt(this.data.base_amount);
    }

    receiveAmount(): bigint {
        return this.data.direction === "Buy"
            ? BigInt(this.data.base_amount)
            : BigInt(this.data.quote_amount);
    }

    // Decimal-corrected amount methods
    decimalCorrectedSendAmount(): number {
        return this.sendToken().convertToDecimal(this.sendAmount());
    }

    decimalCorrectedReceiveAmount(): number {
        return this.receiveToken().convertToDecimal(this.receiveAmount());
    }

    // Price calculation (USDC per base token)
    price(): number {
        const baseNum = this.baseToken().convertToDecimal(BigInt(this.data.base_amount));
        const quoteNum = this.quoteToken().convertToDecimal(BigInt(this.data.quote_amount));
        return baseNum !== 0 ? quoteNum / baseNum : 0;
    }

    // Formatted methods (importing formatting functions from utils)
    formattedSendAmount(): string {
        const amount = this.decimalCorrectedSendAmount();
        // Use USDC formatting for Buy (sending USDC), token formatting for Sell (sending base token)
        return this.data.direction === "Buy" ? formatUSDC(amount) : formatTokenAmount(amount);
    }

    formattedReceiveAmount(): string {
        const amount = this.decimalCorrectedReceiveAmount();
        // Use token formatting for Buy (receiving base token), USDC formatting for Sell (receiving USDC)
        return this.data.direction === "Buy" ? formatTokenAmount(amount) : formatUSDC(amount);
    }

    formattedPrice(): string {
        return formatUSDC(this.price());
    }
}

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
export type TwapSimulationResult = z.infer<typeof TwapSimulationResultSchema>;
