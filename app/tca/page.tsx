import { Suspense } from "react";
import { TwapParameterForm } from "./client/twap-parameter-form";
import { TwapSimulationEmpty } from "./client/twap-simulation-empty";
import { TwapSimulationError } from "./client/twap-simulation-error";
import { TwapSimulationLoading } from "./client/twap-simulation-loading";
import { ErrorBoundary } from "./components/error-boundary";
import { TwapParams } from "./lib/url-params";
import { PriceImprovementCard } from "./server/price-improvement-card";
import { RoutedRenegadeChart } from "./server/routed-through-renegade-chart";
import { TablesSection } from "./server/tables-section";

interface TwapPageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TwapPage({ searchParams }: TwapPageProps) {
    const resolvedSearchParams = await searchParams;
    const hasQueryParams = Object.keys(resolvedSearchParams).length > 0;
    const params = hasQueryParams ? TwapParams.fromUrl(resolvedSearchParams) : TwapParams.default();

    const formData = params.toServerActionParams();
    const renderSimulation = hasQueryParams;

    // Create stable key for ErrorBoundary reset
    // Changes when params change OR when user navigates (retry with same params)
    const errorBoundaryKey = `${params.toCanonicalKey()}-${Date.now()}`;

    return (
        // SidebarInset already establishes a flex column with header/footer siblings.
        // We fill the remaining slot and mask overflow here so only the inner <main> handles scrolling.
        <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto">
                <div className="container pb-6">
                    <div className="mt-12">
                        <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
                            Binance TWAP vs. Renegade Mid Cross
                        </h1>
                        <div className="text-sm font-medium text-muted-foreground w-2/3">
                            This transaction cost analysis tool shows you the approximate price
                            improvement you&apos;d see by integrating Renegade for spot liquidity.
                            It compares a simple Binance TWAP versus a Renegade mid sweep with
                            Binance backfill on all uncrossed volume. All results are computed from
                            tick-level data recorded in real time.
                        </div>
                        <div className="flex gap-6 mt-6">
                            {renderSimulation ? (
                                <ErrorBoundary
                                    fallback={
                                        <div className="flex-1">
                                            <TwapSimulationError error="An error occurred while rendering the simulation." />
                                        </div>
                                    }
                                    key={errorBoundaryKey}
                                >
                                    <Suspense fallback={<TwapSimulationLoading />}>
                                        <div className="grid grid-rows-[auto_1fr] gap-6 flex-1">
                                            <div className="flex gap-6">
                                                <div className="flex-1">
                                                    <RoutedRenegadeChart formData={formData} />
                                                </div>
                                                <div className="flex-1">
                                                    <PriceImprovementCard formData={formData} />
                                                </div>
                                            </div>
                                            <TablesSection formData={formData} />
                                        </div>
                                    </Suspense>
                                </ErrorBoundary>
                            ) : (
                                <div className="flex-1 border border-dashed grid place-items-center">
                                    <TwapSimulationEmpty />
                                </div>
                            )}

                            <div className="self-start p-3 border w-96">
                                <TwapParameterForm initialFormData={params.toFormData()} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
