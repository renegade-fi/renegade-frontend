import { getRoutedThroughRenegadeChartData } from "../actions/get-routed-through-renegade";
import type { SimulateTwapResult } from "../actions/simulate-twap-action";
import { RoutedRenegadeChartClient } from "../client/routed-through-renegade-chart";
import { TwapSimulation } from "../lib/twap-server-client/api-types/request-response";
import { TwapParams } from "../lib/twap-server-client/api-types/twap";

export async function RoutedRenegadeChart({
    simulationData,
}: {
    simulationData: SimulateTwapResult;
}) {
    const simData = TwapSimulation.new({ strategies: simulationData.simData! });
    const twapParams = TwapParams.new(simulationData.twapParams!);
    const routedThroughRenegadeChartData = getRoutedThroughRenegadeChartData(simData, twapParams);

    return <RoutedRenegadeChartClient data={routedThroughRenegadeChartData} />;
}
