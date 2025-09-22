import type { UseQueryOptions } from "@tanstack/react-query";

import { fetchDarkpoolBalances } from "@/app/stats/actions/fetch-darkpool-balances";
import type { BalanceDataWithTotal } from "@/app/stats/actions/types";

type QueryKey = ["stats", "balance"];

/** Factory function returning query options for the balance query */
export function balanceQueryOptions(): UseQueryOptions<
    BalanceDataWithTotal,
    Error,
    BalanceDataWithTotal,
    QueryKey
> {
    const queryKey: QueryKey = ["stats", "balance"];

    return {
        queryFn: fetchDarkpoolBalances,
        queryKey,
    };
}
