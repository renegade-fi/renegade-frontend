import { getInfoTableData } from "./actions/get-info-table-data";
import { getPriceTableData } from "./actions/get-price-table-data";
import { getSimulation } from "./actions/get-simulation";
import { getTableMeta, getTableRows } from "./actions/get-table-data";
import { TwapFillsTable } from "./client/twap-fills-table";
import { TwapInfoTable } from "./client/twap-info-table";
import { TwapPriceTable } from "./client/twap-price-table";
import { TwapSimulationEmpty } from "./client/twap-simulation-empty";
import { TwapSimulationError } from "./client/twap-simulation-error";
import type { SearchParams } from "./page";

interface TwapSimulationResultsProps {
    searchParams: SearchParams;
}

export async function TwapSimulationResults({ searchParams }: TwapSimulationResultsProps) {
    const { simData, twapParams, error } = await getSimulation(searchParams);

    // Error state
    if (error) {
        return <TwapSimulationError error={error} />;
    }

    // Empty state
    if (!simData || !twapParams) {
        return <TwapSimulationEmpty />;
    }

    // Success state: compute and display results
    const infoTableData = getInfoTableData(simData, twapParams);
    const priceTableData = getPriceTableData(simData, twapParams);
    const tableMeta = getTableMeta(twapParams);
    const tableRows = getTableRows(simData, twapParams);

    return (
        <>
            <div className="flex gap-6 flex-1">
                <TwapInfoTable data={infoTableData} />
                <TwapPriceTable data={priceTableData} />
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
