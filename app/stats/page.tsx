import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { balanceQueryOptions } from "@/app/stats/hooks/balance-query-options";
import { PageClient } from "@/app/stats/page-client";

import { ScrollArea } from "@/components/ui/scroll-area";

export default async function Page() {
    const queryClient = new QueryClient();

    // Prefetch balance data
    await queryClient.prefetchQuery(balanceQueryOptions());

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ScrollArea className="flex-grow" type="always">
                <PageClient />
            </ScrollArea>
        </HydrationBoundary>
    );
}
