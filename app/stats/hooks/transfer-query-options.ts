import type { UseQueryOptions } from "@tanstack/react-query";
import type { TransferData } from "@/app/stats/actions/fetch-transfer-data";
import { fetchTransferData } from "@/app/stats/actions/fetch-transfer-data";

type QueryKey = ["stats", "darkpool-deposit-withdrawal"];

/** Factory function returning query options for the transfer data query */
export function transferQueryOptions(): UseQueryOptions<
    TransferData[],
    Error,
    TransferData[],
    QueryKey
> {
    const queryKey: QueryKey = ["stats", "darkpool-deposit-withdrawal"];

    return {
        queryFn: fetchTransferData,
        queryKey,
    };
}
