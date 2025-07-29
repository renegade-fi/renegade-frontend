import { redirect } from "next/navigation";

import { getFallbackTicker, hydrateServerState } from "./[base]/utils";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // Hydrate server-side state from cookies
    const serverState = await hydrateServerState();
    const ticker = getFallbackTicker(serverState);

    // Preserve search parameters in the redirect
    const params = await searchParams;
    const queryString = new URLSearchParams(params as any).toString();

    redirect(queryString ? `/trade/${ticker}?${queryString}` : `/trade/${ticker}`);
}
