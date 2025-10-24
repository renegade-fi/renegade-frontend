import { Token } from "@renegade-fi/token-nextjs";
import { unstable_cache } from "next/cache";
import type z from "zod";
import { client as PriceReporterClient } from "@/lib/clients/price-reporter";
import { DEFAULT_BINANCE_FEE } from "../lib/binance-fee-tiers";
import { findTokenByAddress } from "../lib/token-utils";
import { TwapClient } from "../lib/twap-server-client";
import {
    type SimulateTwapResponseSchema,
    TwapSimulation,
    type TwapStrategy,
} from "../lib/twap-server-client/api-types/request-response";
import type { TwapOptionsSchema, TwapParamsData } from "../lib/twap-server-client/api-types/twap";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";
import { convertDecimalToRaw } from "../lib/utils";

// Cache at top, then exported API, then helper
const cachedSimulateTwap = unstable_cache(simulateTwapWithPrice, ["twap-simulate"], {
    revalidate: 60,
    tags: ["twap-sim"],
});

export async function twapLoader(
    twapParams: TwapParams,
    strategies: TwapStrategy[] = ["Renegade", "Binance"],
    options: z.infer<typeof TwapOptionsSchema> = { binance_fee: DEFAULT_BINANCE_FEE },
): Promise<TwapSimulation> {
    const data = await cachedSimulateTwap(twapParams.data, strategies, options);
    return TwapSimulation.new(data);
}

// Core implementation: enrich params from quote_amount (if provided) and run simulation
async function simulateTwapWithPrice(
    data: TwapParamsData,
    strategies: TwapStrategy[] = ["Renegade", "Binance"],
    options: z.infer<typeof TwapOptionsSchema>,
): Promise<z.output<typeof SimulateTwapResponseSchema>> {
    const baseAddress = data.base_mint;
    const baseToken = findTokenByAddress(baseAddress);
    if (data.quote_amount !== "0") {
        const price = await PriceReporterClient.getPrice(baseAddress);
        const baseDecimals = baseToken?.decimals ?? 0;
        const baseAmt = getBaseAmountFromQuote(data.quote_amount, baseDecimals, price);
        data = { ...data, base_amount: baseAmt.toString() };
    }

    const params = TwapParams.new(data).toSimulateRequest(strategies, options);
    return await TwapClient.simulateTwap(params);
}

function getBaseAmountFromQuote(quoteAmt: string, baseDecimals: number, price: number): bigint {
    // Convert the quote amount to a decimal value
    const quoteToken = Token.fromTicker("USDC");
    const quoteAmtNumber = quoteToken.convertToDecimal(BigInt(quoteAmt));

    // The decimal corrected base amount
    const decimalCorrectedBaseAmt = quoteAmtNumber / price;
    const rawBaseAmt = convertDecimalToRaw(decimalCorrectedBaseAmt, baseDecimals);
    return rawBaseAmt;
}
