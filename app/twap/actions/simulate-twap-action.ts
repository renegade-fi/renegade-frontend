"use server";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import { z } from "zod";
import { BINANCE_TAKER_BPS_BY_TIER, type BinanceFeeTier } from "../lib/binance-fee-tiers";
import { DURATION_PRESETS } from "../lib/constants";
import { calculateEndDate } from "../lib/date-utils";
import { findTokenByTicker } from "../lib/token-utils";
import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams, TwapParamsSchema } from "../lib/twap-server-client/api-types/twap";
import { convertDecimalToRaw } from "../lib/utils";
import { twapLoader } from "../server/loader";

// Form data schema (matches what React Hook Form will send)
const TwapFormDataSchema = z.object({
    binance_fee_tier: z.string(),
    direction: z.enum(["Buy", "Sell"]),
    durationIndex: z.number().int().min(0).max(6),
    input_amount: z.string(),
    selectedBase: z.string(), // Format: "ticker:chainId"
    start_time: z.string(), // UTC ISO datetime string from client
});

export type TwapFormData = z.infer<typeof TwapFormDataSchema>;

export interface SimulateTwapResult {
    simData: TwapSimulation["data"]["strategies"];
    twapParams: TwapParams["data"];
}

export async function simulateTwapAction(formData: TwapFormData): Promise<SimulateTwapResult> {
    // Validate form data
    const validated = TwapFormDataSchema.parse(formData);

    // Parse selected base token
    const [ticker, chainString] = validated.selectedBase.split(":");
    const chainId = Number(chainString) as ChainId;

    const baseToken = findTokenByTicker(ticker);
    const quoteToken = baseToken
        ? Token.fromTickerOnChain("USDC", baseToken.chain as ChainId)
        : undefined;

    if (!baseToken || !quoteToken) {
        throw new Error("Invalid token selection");
    }

    // Convert input amount to raw quote amount
    const inputAmount = Number(validated.input_amount);
    const usdc = Token.fromTickerOnChain("USDC", chainId);
    const quoteRaw = convertDecimalToRaw(inputAmount, usdc.decimals);

    // Calculate duration and end time
    // start_time is already in UTC ISO format from client
    const selectedDuration = DURATION_PRESETS[validated.durationIndex];
    const startTime = new Date(validated.start_time);
    const endTime = calculateEndDate(startTime, selectedDuration.hours, selectedDuration.minutes);

    // Calculate number of trades (30 seconds per clip)
    const totalSeconds = selectedDuration.hours * 3600 + selectedDuration.minutes * 60;
    const numberOfTrades = Math.max(1, Math.floor(totalSeconds / 30));

    // Build server params
    const serverParams = TwapParamsSchema.parse({
        base_amount: "0",
        base_mint: baseToken.address,
        direction: validated.direction,
        end_time: endTime.toISOString(),
        num_trades: numberOfTrades,
        quote_amount: quoteRaw.toString(),
        quote_mint: quoteToken.address,
        start_time: startTime.toISOString(),
    });

    // Get binance fee from tier and convert to decimal value
    const binanceFeeTier = validated.binance_fee_tier as BinanceFeeTier;
    const binanceFee = BINANCE_TAKER_BPS_BY_TIER[binanceFeeTier];

    // Build TwapParams and call loader
    const twapParams = TwapParams.new(serverParams);
    const simData = await twapLoader(twapParams, undefined, {
        binance_fee: binanceFee,
    });

    // Return serializable data (errors will be thrown and caught by React Query)
    return {
        simData: simData.data.strategies,
        twapParams: twapParams.data,
    };
}
