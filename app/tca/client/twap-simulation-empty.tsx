"use client";

import { TrendingUp } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

export function TwapSimulationEmpty() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <TrendingUp />
                </EmptyMedia>
                <EmptyTitle>Try running a simulation</EmptyTitle>
                <EmptyDescription>
                    Enter TWAP order to compare how Binance TWAP performs against
                    Binance-with-Renegade TWAP
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
