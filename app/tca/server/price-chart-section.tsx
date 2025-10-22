import { getPriceTableData } from "../actions/get-price-table-data";
import { getCachedSimulation, type TwapFormData } from "../actions/simulate-twap-action";
import { PriceImprovementChartWrapper } from "../client/price-improvement-chart-wrapper";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function PriceChartSection({ formData }: { formData: TwapFormData }) {
    const result = await getCachedSimulation(formData);
    const simData = TwapSimulation.new({ strategies: result.simData });
    const twapParams = TwapParams.new(result.twapParams);
    const priceTableData = getPriceTableData(simData, twapParams);

    return <PriceImprovementChartWrapper data={priceTableData} />;
}
