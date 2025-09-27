import type { UseQueryOptions } from "@tanstack/react-query";

import { fetchDarkpoolBalances } from "@/app/stats/actions/fetch-darkpool-balances";
import type { BalanceDataWithTotal } from "@/app/stats/actions/types";

type QueryKey = ["stats", "balance", string];

/** Factory function returning query options for the balance query */
export function balanceQueryOptions(
    chainId: 0 | 42161 | 8453,
): UseQueryOptions<BalanceDataWithTotal, Error, BalanceDataWithTotal, QueryKey> {
    const queryKey: QueryKey = ["stats", "balance", chainId === 0 ? "all" : String(chainId)];

    return {
        queryFn: () => fetchDarkpoolBalances(chainId),
        queryKey,
    };
}
