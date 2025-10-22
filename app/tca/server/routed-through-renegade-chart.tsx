import { getInfoTableData } from "../actions/get-info-table-data";
import { getCachedSimulation, type TwapFormData } from "../actions/simulate-twap-action";
import { RoutedRenegadeChartClient } from "../client/routed-through-renegade-chart";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function RoutedRenegadeChart({ formData }: { formData: TwapFormData }) {
    const result = await getCachedSimulation(formData);
    const simData = TwapSimulation.new({ strategies: result.simData });
    const twapParams = TwapParams.new(result.twapParams);
    const infoTableData = getInfoTableData(simData, twapParams);

    return <RoutedRenegadeChartClient data={infoTableData} />;
}
