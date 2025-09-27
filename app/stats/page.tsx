import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { balanceQueryOptions } from "@/app/stats/hooks/balance-query-options";
import { netFlowQueryOptions } from "@/app/stats/hooks/net-flow-query-options";
import { transferQueryOptions } from "@/app/stats/hooks/transfer-query-options";
import { PageClient } from "@/app/stats/page-client";

import { ScrollArea } from "@/components/ui/scroll-area";

export default async function Page() {
    const queryClient = new QueryClient();

    // Prefetch balance, transfer, and net flow data
    await Promise.all([
        queryClient.prefetchQuery(balanceQueryOptions(0)),
        queryClient.prefetchQuery(transferQueryOptions(0)),
        queryClient.prefetchQuery(netFlowQueryOptions(0)),
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ScrollArea className="flex-grow" type="always">
                <PageClient />
            </ScrollArea>
        </HydrationBoundary>
    );
}
