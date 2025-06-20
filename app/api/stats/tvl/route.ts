import { getSDKConfig } from "@renegade-fi/react";
import type { NextRequest } from "next/server";

import { fetchTvl, getAlchemyRpcUrl } from "@/app/api/utils";

import { DISPLAY_TOKENS } from "@/lib/token";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    try {
        const chainIdParam = req.nextUrl.searchParams.get("chainId");
        const chainId = Number(chainIdParam);

        const rpcUrl = getAlchemyRpcUrl(chainId);
        const sdkConfig = getSDKConfig(chainId);
        const tokens = DISPLAY_TOKENS({ chainId });

        const tvlData = await Promise.all(
            tokens.map(async (token) => {
                try {
                    const tvl = await fetchTvl(token.address, rpcUrl, sdkConfig.darkpoolAddress);
                    return { address: token.address, tvl: tvl.toString() };
                } catch (error) {
                    console.error(`Error fetching TVL for ${token.ticker}:`, error);
                    return { address: token.address, tvl: "0" };
                }
            }),
        );

        return new Response(JSON.stringify({ data: tvlData }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in GET:", error);
        return new Response(
            JSON.stringify({
                error: `Invalid or unsupported chain ID: ${req.nextUrl.searchParams.get("chainId")}`,
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
