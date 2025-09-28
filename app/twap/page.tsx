import { ScrollArea } from "@/components/ui/scroll-area";
import { getSimulation } from "./actions/get-simulation";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimTable } from "./client/twap-sim-table";

// The type of the search params
export type SearchParams = { [key: string]: string | string[] | undefined };
type SearchParamsPromise = Promise<SearchParams>;

export default async function TwapPage({ searchParams }: { searchParams: SearchParamsPromise }) {
    const params = await searchParams;
    const { baseMint, simData, table } = await getSimulation(params);

    return (
        <ScrollArea className="flex-grow" type="always">
            <main className="container pb-6">
                <div className="mt-12">
                    <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Binance TWAP vs Binance-with-Renegade TWAP
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <TwapSimTable table={table} />

                        <div className="flex-1 p-3 border">
                            <TwapParameterForm searchParams={params} />
                        </div>
                    </div>
                </div>
            </main>
        </ScrollArea>
    );
}
