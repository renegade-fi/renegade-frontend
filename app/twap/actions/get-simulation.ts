"use server";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import { DEFAULT_BINANCE_FEE } from "../lib/binance-fee-tiers";
import { findTokenByTicker } from "../lib/token-utils";
import type { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import {
    TwapParams,
    TwapParamsSchema,
    TwapUrlParamsSchema,
} from "../lib/twap-server-client/api-types/twap";
import { twapLoader } from "../server/loader";

export type SearchParams = { [key: string]: string | string[] | undefined };

export async function getSimulation(searchParams: SearchParams): Promise<{
    simData: TwapSimulation | null;
    twapParams: TwapParams | null;
    error?: string;
}> {
    const urlResult = TwapUrlParamsSchema.safeParse(searchParams);
    if (!urlResult.success) {
        return { simData: null, twapParams: null };
    }

    const { data } = urlResult;

    const baseToken = findTokenByTicker(data.base_ticker);
    const quoteToken = baseToken
        ? Token.fromTickerOnChain("USDC", baseToken.chain as ChainId)
        : undefined;
    if (!baseToken || !quoteToken) {
        return { simData: null, twapParams: null };
    }

    const serverParams = TwapParamsSchema.parse({
        base_amount: "0", // Always use quote_amount, ignore base_amount from URL
        base_mint: baseToken.address,
        direction: data.direction,
        end_time: data.end_time,
        num_trades: data.num_trades,
        quote_amount: data.quote_amount,
        quote_mint: quoteToken.address,
        start_time: data.start_time,
    });

    const feeParam = searchParams.binance_taker_bps as string | undefined;
    const binanceFee = feeParam ? Number(feeParam) : DEFAULT_BINANCE_FEE;

    const twapParams = TwapParams.new(serverParams);

    try {
        const simData = await twapLoader(twapParams, undefined, {
            binance_fee: binanceFee,
        });

        return { simData, twapParams };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load simulation";
        return {
            error: errorMessage,
            simData: null,
            twapParams,
        };
    }
}
