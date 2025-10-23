import { getExecutionInfo } from "../actions/get-execution-info";
import { getExecutionResults } from "../actions/get-execution-results";
import { getMetadata, getRows } from "../actions/get-fills-data";
import type { SimulateTwapResult } from "../actions/simulate-twap-action";
import { ExecutionInfoTableClient } from "../client/execution-info-table";
import { ExecutionResultsTableClient } from "../client/execution-results-table";
import { FillsTable } from "../client/twap-fills-table";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function TablesSection({ simulationData }: { simulationData: SimulateTwapResult }) {
    const simData = TwapSimulation.new({ strategies: simulationData.simData! });
    const twapParams = TwapParams.new(simulationData.twapParams!);

    const executionInfo = getExecutionInfo(simData, twapParams);
    const executionResults = getExecutionResults(simData, twapParams);
    const fillsTableMetadata = getMetadata(twapParams);
    const fillsTableRows = getRows(simData, twapParams);

    return (
        <>
            <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Execution Results</h3>
                <div className="flex gap-6">
                    <ExecutionInfoTableClient data={executionInfo} />
                    <ExecutionResultsTableClient data={executionResults} />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold">Individual Fills</h3>
                <FillsTable meta={fillsTableMetadata} rows={fillsTableRows} />
            </div>
        </>
    );
}
