"use client";

import { useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { simulateTwapAction } from "./actions/simulate-twap-action";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimulationResults } from "./twap-simulation-results";

export default function TwapPage() {
    // Lift mutation to parent - both children can access it
    const mutation = useMutation({
        mutationFn: simulateTwapAction,
        mutationKey: ["twap-simulation"],
    });

    return (
        <ScrollArea className="flex-grow" type="always">
            <main className="container pb-6">
                <div className="mt-12">
                    <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Binance TWAP vs Binance-with-Renegade TWAP
                    </h1>
                    <div className="flex gap-6 mt-6">
                        <div className="grid grid-rows-[auto_1fr] gap-6 flex-1">
                            <TwapSimulationResults mutation={mutation} />
                        </div>

                        <div className="self-start p-3 border">
                            <TwapParameterForm mutation={mutation} />
                        </div>
                    </div>
                </div>
            </main>
        </ScrollArea>
    );
}
