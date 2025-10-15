import { ScrollArea } from "@/components/ui/scroll-area";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimulationResults } from "./twap-simulation-results";

// The type of the search params
export type SearchParams = { [key: string]: string | string[] | undefined };
type SearchParamsPromise = Promise<SearchParams>;

export default async function TwapPage({ searchParams }: { searchParams: SearchParamsPromise }) {
    const params = await searchParams;

    return (
        <ScrollArea className="flex-grow" type="always">
            <main className="container pb-6">
                <div className="mt-12">
                    <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                        Binance TWAP vs Binance-with-Renegade TWAP
                    </h1>
                    <div className="flex gap-6 mt-6">
                        <div className="grid grid-rows-[auto_1fr] gap-6 flex-1">
                            <TwapSimulationResults searchParams={params} />
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
