"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import { getInfoTableData } from "./actions/get-info-table-data";
import { getPriceTableData } from "./actions/get-price-table-data";
import { getTableMeta, getTableRows } from "./actions/get-table-data";
import type { SimulateTwapResult, TwapFormData } from "./actions/simulate-twap-action";
import { TwapFillsTable } from "./client/twap-fills-table";
import { TwapInfoTable } from "./client/twap-info-table";
import { TwapPriceTable } from "./client/twap-price-table";
import { TwapSimulationEmpty } from "./client/twap-simulation-empty";
import { TwapSimulationError } from "./client/twap-simulation-error";
import { TwapSimulationLoading } from "./client/twap-simulation-loading";
import { TwapSimulation } from "./lib/twap-server-client/api-types/request-response";
import { TwapParams } from "./lib/twap-server-client/api-types/twap";

interface TwapSimulationResultsProps {
    mutation: UseMutationResult<SimulateTwapResult, Error, TwapFormData>;
}

export function TwapSimulationResults({ mutation }: TwapSimulationResultsProps) {
    // Loading state - mutation is pending
    if (mutation.isPending) {
        return <TwapSimulationLoading />;
    }

    // Error state (React Query catches all thrown errors)
    if (mutation.error) {
        const errorMessage =
            mutation.error instanceof Error ? mutation.error.message : "Failed to simulate TWAP";
        return <TwapSimulationError error={errorMessage} />;
    }

    // Empty state - no data yet
    if (!mutation.data) {
        return <TwapSimulationEmpty />;
    }

    // Success - data is guaranteed to be valid
    const { simData: rawSimData, twapParams: rawTwapParams } = mutation.data;

    // Reconstruct TwapSimulation and TwapParams from server action data
    const simData = TwapSimulation.new({ strategies: rawSimData });
    const twapParams = TwapParams.new(rawTwapParams);

    // Compute and display results
    const infoTableData = getInfoTableData(simData, twapParams);
    const priceTableData = getPriceTableData(simData, twapParams);
    const tableMeta = getTableMeta(twapParams);
    const tableRows = getTableRows(simData, twapParams);

    return (
        <>
            <div className="flex gap-6">
                <div className="border">
                    <TwapInfoTable data={infoTableData} />
                </div>
                <div className="border flex-1 self-start">
                    <TwapPriceTable data={priceTableData} />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold tracking-tighter lg:tracking-normal">
                    Fills
                </h3>
                <TwapFillsTable meta={tableMeta} rows={tableRows} />
            </div>
        </>
    );
}
