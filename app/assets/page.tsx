import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { PageClient } from "@/app/assets/page-client";

import { ScrollArea } from "@/components/ui/scroll-area";

export default async function Page() {
    const queryClient = new QueryClient();

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ScrollArea className="flex-grow" type="always">
                <PageClient />
            </ScrollArea>
        </HydrationBoundary>
    );
}
