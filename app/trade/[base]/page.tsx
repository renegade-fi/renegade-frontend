import { chainIdFromEnvAndName } from "@renegade-fi/react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { PageClient } from "@/app/trade/[base]/page-client";
import { env } from "@/env/client";
import { DISPLAY_TOKENS } from "@/lib/token";
import { getTickerRedirect, hydrateServerState } from "./utils";

export async function generateStaticParams() {
    const tokens = DISPLAY_TOKENS({ hideHidden: true, hideStables: true });
    return tokens.map((token) => ({
        base: token.ticker,
    }));
}

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ base: string }>;
    searchParams: Promise<{ chain?: string }>;
}) {
    const baseTicker = (await params).base;
    const chainName = (await searchParams).chain; // providers/state-provider/server-store-provider.tsx::SEARCH_PARAM_CHAIN
    console.log("🚀 ~ Page ~ chainName:", chainName);
    let chainId;
    try {
        chainId = chainIdFromEnvAndName(env.NEXT_PUBLIC_CHAIN_ENVIRONMENT, chainName as any);
    } catch (error) {
        chainId = undefined;
    }

    // Hydrate server-side state from cookies
    const serverState = await hydrateServerState();

    const resolvedTicker = getTickerRedirect(baseTicker, serverState);
    if (resolvedTicker) redirect(`/trade/${resolvedTicker}`);

    const queryClient = new QueryClient();
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <PageClient base={baseTicker} chainId={chainId} />
        </HydrationBoundary>
    );
}
