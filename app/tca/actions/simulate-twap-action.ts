"use server";

import { z } from "zod";
import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams as TwapServerParams } from "../lib/twap-server-client/api-types/twap";
import { TwapParams as UrlTwapParams } from "../lib/url-params";
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
    simData?: TwapSimulation["data"]["strategies"];
    twapParams?: TwapServerParams["data"];
    error?: string;
}

// Wrap with React cache for request-level deduplication, then unstable_cache for cross-request caching
export const getCachedSimulation = async (formData: TwapFormData): Promise<SimulateTwapResult> => {
    const validated = TwapFormDataSchema.parse(formData);
    const params = UrlTwapParams.fromFormData(validated);
    const { params: simulationParams, binanceFee } = params.toSimulationPayload();
    const twapParams = TwapServerParams.new(simulationParams);

    try {
        const simData = await twapLoader(twapParams, undefined, { binance_fee: binanceFee });
        return {
            simData: simData.data.strategies,
            twapParams: twapParams.data,
        };
    } catch (error) {
        return {
            error: "An error occurred while rendering the simulation.",
        };
    }
};
