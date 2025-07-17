import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { formatCurrency } from "@/lib/format";
import { extractSupportedChain, getFormattedChainName } from "@/lib/viem";

import { useTvlData } from "../../hooks/use-tvl-data";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export function TvlSection({ chainId }: { chainId: number }) {
    const tvlData = useTvlData(chainId);
    const { totalTvlUsd, totalBaseTvlUsd, totalArbitrumTvlUsd } = tvlData.reduce(
        (acc, curr) => {
            acc.totalTvlUsd += curr.totalTvlUsd;
            acc.totalBaseTvlUsd += curr.baseTvlUsd;
            acc.totalArbitrumTvlUsd += curr.arbitrumTvlUsd;
            return acc;
        },
        { totalArbitrumTvlUsd: 0, totalBaseTvlUsd: 0, totalTvlUsd: 0 },
    );

    const chainSuffix = useMemo(() => {
        if (!chainId) return "";
        const chain = extractSupportedChain(chainId);
        return ` on ${getFormattedChainName(chain.id)}`;
    }, [chainId]);

    return (
        <Card className="w-full rounded-none">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
                        {totalTvlUsd ? (
                            formatCurrency(totalTvlUsd)
                        ) : (
                            <Skeleton className="h-10 w-40" />
                        )}
                    </CardTitle>
                    <CardDescription>Total Value Deposited{chainSuffix}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <DataTable chainId={chainId} columns={columns} data={tvlData} />
            </CardContent>
        </Card>
    );
}
