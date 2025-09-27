import type { UseQueryOptions } from "@tanstack/react-query";
import type { NetFlowData } from "@/app/stats/actions/fetch-net-flow";
import { fetchNetFlow } from "@/app/stats/actions/fetch-net-flow";

type QueryKey = ["stats", "net-flow", string];

/** Factory function returning query options for the net flow query */
export function netFlowQueryOptions(
    chainId: 0 | 42161 | 8453,
): UseQueryOptions<NetFlowData, Error, NetFlowData, QueryKey> {
    const queryKey: QueryKey = ["stats", "net-flow", chainId === 0 ? "all" : String(chainId)];
    const dbChainId = chainId === 0 ? undefined : chainId;

    return {
        queryFn: () => fetchNetFlow(dbChainId),
        queryKey,
    };
}
