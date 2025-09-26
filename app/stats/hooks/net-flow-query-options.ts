import type { UseQueryOptions } from "@tanstack/react-query";
import type { NetFlowData } from "@/app/stats/actions/fetch-net-flow";
import { fetchNetFlow } from "@/app/stats/actions/fetch-net-flow";

type QueryKey = ["stats", "net-flow", number?];

/** Factory function returning query options for the net flow query */
export function netFlowQueryOptions(
    chainId?: number,
): UseQueryOptions<NetFlowData, Error, NetFlowData, QueryKey> {
    const queryKey: QueryKey = ["stats", "net-flow", chainId];

    return {
        queryFn: () => fetchNetFlow(chainId),
        queryKey,
    };
}
