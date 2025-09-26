"use client";

import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";
import { ChainSelector } from "./chain-selector";
import { BalanceSection } from "./charts/balance/balance-section";
import { InflowsChart } from "./charts/inflows-chart";
import { TimeToFillCard } from "./charts/time-to-fill-card";
import { VolumeChart } from "./charts/volume-chart";
import { balanceQueryOptions } from "./hooks/balance-query-options";
import { netFlowQueryOptions } from "./hooks/net-flow-query-options";
import { transferQueryOptions } from "./hooks/transfer-query-options";

export function PageClient() {
    const [selectedChainId, setSelectedChainId] = useState<number>(0);
    const { data: balanceData } = useQuery(balanceQueryOptions());
    const { data: transferData } = useQuery(transferQueryOptions());
    const { data: netFlowData } = useQuery(netFlowQueryOptions(selectedChainId || undefined));
    return (
        <main className="container mb-8 mt-12 flex flex-col gap-12 px-4 lg:px-8">
            <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                    <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Volume
                    </h1>
                    <VolumeChart chainId={selectedChainId} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                    <div className="mb-4 mt-6 flex items-center justify-between">
                        <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                            Time to Fill
                        </h1>
                        <ChainSelector chainId={selectedChainId} onChange={setSelectedChainId} />
                    </div>
                    <div className="relative border py-16">
                        <TimeToFillCard chainId={selectedChainId} />
                        <div className="absolute bottom-2 right-4">
                            <Button
                                asChild
                                className="p-0 text-xs text-muted-foreground"
                                variant="link"
                            >
                                <a
                                    href={HELP_CENTER_ARTICLES.ORDER_FILLING.url}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    <Info className="mr-1 h-3 w-3" />
                                    Why the wait?
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 grid-rows-[1fr] gap-12 lg:gap-4">
                <div className="col-span-1 flex flex-col">
                    <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Total Value Deposited
                    </h1>
                    {balanceData && (
                        <BalanceSection
                            balanceData={balanceData}
                            selectedChainId={selectedChainId}
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                    <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Inflows
                    </h1>
                    <InflowsChart
                        chainId={selectedChainId}
                        netFlowData={netFlowData || { netFlow: 0 }}
                        transferData={transferData || []}
                    />
                </div>
            </div>
        </main>
    );
}
