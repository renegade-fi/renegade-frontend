import { getPriceImprovementData } from "../actions/get-price-improvement";
import type { SimulateTwapResult } from "../actions/simulate-twap-action";
import { PriceImprovementCardClient } from "../client/price-improvement-card";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function PriceImprovementCard({
    simulationData,
}: {
    simulationData: SimulateTwapResult;
}) {
    const simData = TwapSimulation.new({ strategies: simulationData.simData! });
    const twapParams = TwapParams.new(simulationData.twapParams!);
    const priceImprovementData = getPriceImprovementData(simData, twapParams);

    return <PriceImprovementCardClient data={priceImprovementData} />;
}
