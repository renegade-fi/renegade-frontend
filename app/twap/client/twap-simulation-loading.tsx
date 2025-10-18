"use client";

import { Loader2 } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

export function TwapSimulationLoading() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia className="bg-transparent" variant="icon">
                    <Loader2 className="animate-spin" />
                </EmptyMedia>
                <EmptyTitle>Simulating</EmptyTitle>
                <EmptyDescription>Fetching historical data...</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
