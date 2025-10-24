import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PriceImprovementChartSkeleton, RenegadeFillChartSkeleton } from "./client/chart-skeleton";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimulationLoading } from "./client/twap-simulation-loading";
import { TwapParams } from "./lib/url-params";
import { InfoChartSection } from "./server/info-chart-section";
import { PriceChartSection } from "./server/price-chart-section";
import { TablesSection } from "./server/tables-section";

export const revalidate = 60;

interface TwapPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TwapPage({ searchParams }: TwapPageProps) {
    const params = TwapParams.fromUrl(await searchParams);

    // If params are invalid, redirect to valid defaults
    if (!params.isValid()) {
        redirect(`/twap?${TwapParams.default().toUrlString()}`);
    }

    const formData = params.toServerActionParams();

    return (
        // <ScrollArea className="flex-grow" type="always">
        <main className="container pb-6">
            <div className="mt-12">
                <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                    Binance TWAP vs Binance-with-Renegade TWAP
                </h1>
                <div className="flex gap-6 mt-6">
                    <div className="grid grid-rows-[auto_1fr] gap-6 flex-1">
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <Suspense fallback={<RenegadeFillChartSkeleton />}>
                                    <InfoChartSection formData={formData} />
                                </Suspense>
                            </div>
                            <div className="flex-1">
                                <Suspense fallback={<PriceImprovementChartSkeleton />}>
                                    <PriceChartSection formData={formData} />
                                </Suspense>
                            </div>
                        </div>
                        <Suspense fallback={<TwapSimulationLoading />}>
                            <TablesSection formData={formData} />
                        </Suspense>
                    </div>

                    <div className="self-start p-3 border w-96">
                        <TwapParameterForm initialFormData={params.toFormData()} />
                    </div>
                </div>
            </div>
        </main>
        // </ScrollArea>
    );
}
