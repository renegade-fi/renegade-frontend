import { getSimulation } from "./actions/get-simulation";
import { getSummaryCardData } from "./actions/get-summary-card-data";
import { getTableMeta, getTableRows } from "./actions/get-table-data";
import { TwapSimTable } from "./client/twap-sim-table";
import { TwapSimTableEmpty } from "./client/twap-sim-table-empty";
import { TwapSimTableError } from "./client/twap-sim-table-error";
import { TwapSummaryCard } from "./client/twap-summary-card";
import type { SearchParams } from "./page";

interface TwapSimulationResultsProps {
    searchParams: SearchParams;
}

export async function TwapSimulationResults({ searchParams }: TwapSimulationResultsProps) {
    const { simData, twapParams, error } = await getSimulation(searchParams);

    // Error state
    if (error) {
        return <TwapSimTableError error={error} />;
    }

    // Empty state
    if (!simData || !twapParams) {
        return <TwapSimTableEmpty />;
    }

    // Success state: compute and display results
    const summaryCardData = getSummaryCardData(simData, twapParams);
    const tableMeta = getTableMeta(simData, twapParams);
    const tableRows = getTableRows(simData, twapParams);

    return (
        <>
            <TwapSummaryCard data={summaryCardData} />
            <TwapSimTable meta={tableMeta} rows={tableRows} />
        </>
    );
}
