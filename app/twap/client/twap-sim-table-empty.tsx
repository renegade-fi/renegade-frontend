"use client";

import { Empty, EmptyDescription } from "@/components/ui/empty";

export function TwapSimTableEmpty() {
    return (
        <Empty>
            <EmptyDescription>Run a simulation to see the results...</EmptyDescription>
        </Empty>
    );
}
