import type { UseQueryOptions } from "@tanstack/react-query";
import type { TransferData } from "@/app/stats/actions/fetch-transfer-data";
import { fetchTransferData } from "@/app/stats/actions/fetch-transfer-data";

type QueryKey = ["stats", "darkpool-deposit-withdrawal", string];

/** Factory function returning query options for the transfer data query */
export function transferQueryOptions(
    chainId: 0 | 42161 | 8453,
): UseQueryOptions<TransferData[], Error, TransferData[], QueryKey> {
    const queryKey: QueryKey = [
        "stats",
        "darkpool-deposit-withdrawal",
        chainId === 0 ? "all" : String(chainId),
    ];
    const dbChainId = chainId === 0 ? undefined : chainId;

    return {
        queryFn: () => fetchTransferData(dbChainId),
        queryKey,
    };
}
