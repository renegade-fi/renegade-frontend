import { PageClient } from "@/app/stats/page-client";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function Page() {
    return (
        <ScrollArea className="flex-grow" type="always">
            <PageClient />
        </ScrollArea>
    );
}
