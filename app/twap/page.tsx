import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import type z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TwapChart } from "./client/twap-chart";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { DEFAULT_BINANCE_FEE } from "./lib/binance-fee-tiers";
import { findTokenByTicker } from "./lib/token-utils";
import type { SimulateTwapResponseSchema } from "./lib/twap-server-client/api-types/request-response";
import {
    TwapParams,
    TwapParamsSchema,
    TwapUrlParamsSchema,
} from "./lib/twap-server-client/api-types/twap";
import { twapLoader } from "./server/loader";

// The type of the search params
export type SearchParams = { [key: string]: string | string[] | undefined };
type SearchParamsPromise = Promise<SearchParams>;

export default async function TwapPage({ searchParams }: { searchParams: SearchParamsPromise }) {
    const params = await searchParams;

    // Parse URL params that use tickers
    const urlResult = TwapUrlParamsSchema.safeParse(params);
    let simData: z.output<typeof SimulateTwapResponseSchema> | null = null;
    let baseMint: string | undefined;
    if (urlResult.success) {
        const { data } = urlResult;

        // Convert tickers to addresses for server params
        const baseToken = findTokenByTicker(data.base_ticker);
        const quoteToken = Token.fromTickerOnChain("USDC", baseToken?.chain as ChainId);
        if (baseToken && quoteToken) {
            const serverParams = TwapParamsSchema.parse({
                base_amount: data.base_amount,
                base_mint: baseToken.address,
                direction: data.direction,
                end_time: data.end_time,
                num_trades: data.num_trades,
                quote_amount: data.quote_amount ?? "0",
                quote_mint: quoteToken.address,
                start_time: data.start_time,
            });

            baseMint = serverParams.base_mint;

            // Pass Binance fee to the simulation
            const feeParam = params.binance_taker_bps as string | undefined;
            const binanceFee = feeParam ? Number(feeParam) : DEFAULT_BINANCE_FEE;
            simData = await twapLoader(TwapParams.new(serverParams), undefined, {
                binance_fee: binanceFee,
            });
        }
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <h1 className="text-3xl font-bold text-foreground text-center mb-8">
                Binance TWAP vs Binance-with-Renegade TWAP
            </h1>
            <div className="flex justify-center">
                <div className="w-[90%] h-[75vh] flex gap-6">
                    {/* Chart Area - 70% width */}
                    <Card className="flex-[7]">
                        <TwapChart baseMint={baseMint ?? ""} simData={simData} />
                    </Card>

                    {/* Menu Area - 30% width */}
                    <Card className="flex-[3]">
                        <CardHeader>
                            <CardTitle>TWAP Parameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TwapParameterForm searchParams={params} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
