"use client";

import { TriangleAlert } from "lucide-react";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

interface TwapSimTableErrorProps {
    error: string;
}

export function TwapSimTableError({ error }: TwapSimTableErrorProps) {
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
