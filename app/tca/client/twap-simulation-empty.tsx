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
                    Enter your order details to compare a Binance TWAP against a Renegade Mid Cross.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
