import { getPriceTableData } from "../actions/get-price-table-data";
import { getCachedSimulation, type TwapFormData } from "../actions/simulate-twap-action";
import { PriceImprovementCardClient } from "../client/price-improvement-card";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function PriceImprovementCard({ formData }: { formData: TwapFormData }) {
    const result = await getCachedSimulation(formData);
    const simData = TwapSimulation.new({ strategies: result.simData });
    const twapParams = TwapParams.new(result.twapParams);
    const priceTableData = getPriceTableData(simData, twapParams);

    return <PriceImprovementCardClient data={priceTableData} />;
}
