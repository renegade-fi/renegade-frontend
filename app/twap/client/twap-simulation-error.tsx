"use client";

import { TriangleAlert } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

interface TwapSimulationErrorProps {
    error: string;
}

export function TwapSimulationError({ error }: TwapSimulationErrorProps) {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <TriangleAlert />
                </EmptyMedia>
                <EmptyTitle>Simulation Error</EmptyTitle>
                <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
