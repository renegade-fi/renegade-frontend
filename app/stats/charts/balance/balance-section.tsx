import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { balanceQueryOptions } from "../../hooks/balance-query-options";
import { BalanceTable } from "./balance-table";

interface BalanceSectionProps {
    chainId: 0 | 42161 | 8453;
}

export function BalanceSection({ chainId }: BalanceSectionProps) {
    const { data, isSuccess } = useQuery(balanceQueryOptions(chainId));

    return (
        <Card className="w-full rounded-none">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
                        {formatCurrency(isSuccess ? data.totalUsd : 0)}
                    </CardTitle>
                    <CardDescription>Total Value Deposited</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <BalanceTable data={isSuccess ? data.data : []} selectedChainId={chainId} />
            </CardContent>
        </Card>
    );
}
