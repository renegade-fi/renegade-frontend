import { ScrollArea } from "@/components/ui/scroll-area";
import { getSimulation } from "./actions/get-simulation";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimTable } from "./client/twap-sim-table";
import { TwapSummaryCard } from "./client/twap-summary-card";

// The type of the search params
export type SearchParams = { [key: string]: string | string[] | undefined };
type SearchParamsPromise = Promise<SearchParams>;

export default async function TwapPage({ searchParams }: { searchParams: SearchParamsPromise }) {
    const params = await searchParams;
    const { baseMint, simData, table, summary, request, error } = await getSimulation(params);

    return (
        <ScrollArea className="flex-grow" type="always">
            <main className="container pb-6">
                <div className="mt-12">
                    <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Binance TWAP vs Binance-with-Renegade TWAP
                    </h1>
                    <div className="flex gap-6 mt-6">
                        <div className="grid grid-rows-[auto_1fr] gap-6 flex-1">
                            <TwapSummaryCard request={request} summary={summary} />
                            <TwapSimTable error={error} table={table} />
                        </div>

                        <div className="self-start p-3 border">
                            <TwapParameterForm searchParams={params} />
                        </div>
                    </div>
                </div>
            </main>
        </ScrollArea>
    );
}
