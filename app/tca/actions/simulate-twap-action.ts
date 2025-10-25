"use server";

import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams as TwapServerParams } from "../lib/twap-server-client/api-types/twap";
import {
    type TwapFormData,
    TwapFormDataSchema,
    TwapParams as UrlTwapParams,
} from "../lib/url-params";
import { twapLoader } from "../server/loader";

export interface SimulateTwapResult {
    simData?: TwapSimulation["data"]["strategies"];
    twapParams?: TwapServerParams["data"];
    error?: string;
}

// Wrap with React cache for request-level deduplication, then unstable_cache for cross-request caching
export const getCachedSimulation = async (formData: TwapFormData): Promise<SimulateTwapResult> => {
    const validated = TwapFormDataSchema.parse(formData);
    const params = UrlTwapParams.fromFormData(validated);

    // Validate params before proceeding
    if (!params.isValid()) {
        return {
            error: "Invalid parameters. Please check that all values are correct and within allowed ranges.",
        };
    }

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
