import { redirect } from "next/navigation";
import { SEARCH_PARAM_CHAIN } from "@/lib/constants/storage";
import { getFallbackTicker, hydrateServerState } from "./[base]/utils";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ chain?: string }>;
}) {
    // Hydrate server-side state from cookies
    const serverState = await hydrateServerState();
    const ticker = getFallbackTicker(serverState);

    // Preserve chain parameter in the redirect
    const { chain } = await searchParams;
    const redirectUrl = chain
        ? `/trade/${ticker}?${SEARCH_PARAM_CHAIN}=${chain}`
        : `/trade/${ticker}`;

    redirect(redirectUrl);
}
