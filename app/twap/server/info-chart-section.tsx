import { getInfoTableData } from "../actions/get-info-table-data";
import { getCachedSimulation, type TwapFormData } from "../actions/simulate-twap-action";
import { RenegadeFillChartWrapper } from "../client/renegade-fill-chart-wrapper";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function InfoChartSection({ formData }: { formData: TwapFormData }) {
    const result = await getCachedSimulation(formData);
    const simData = TwapSimulation.new({ strategies: result.simData });
    const twapParams = TwapParams.new(result.twapParams);
    const infoTableData = getInfoTableData(simData, twapParams);

    return <RenegadeFillChartWrapper data={infoTableData} />;
}
