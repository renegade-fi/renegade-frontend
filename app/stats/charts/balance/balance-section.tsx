import type { BalanceDataWithTotal } from "@/app/stats/actions/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { BalanceTable } from "./balance-table";

interface BalanceSectionProps {
    balanceData: BalanceDataWithTotal;
    selectedChainId: number;
}

export function BalanceSection({ balanceData, selectedChainId }: BalanceSectionProps) {
    const { data, totalUsd } = balanceData;

    return (
        <Card className="w-full rounded-none">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
                        {formatCurrency(totalUsd)}
                    </CardTitle>
                    <CardDescription>Total Value Deposited</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <BalanceTable data={data} selectedChainId={selectedChainId} />
            </CardContent>
        </Card>
    );
}
