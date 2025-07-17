import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";

export type SavingsData = {
    savings: number;
    savingsBps: number;
};

type SavingsQueryVariables = {
    amount: string; // value the backend expects (string / decimal)
    baseMint: `0x${string}`;
    direction: "buy" | "sell";
    quoteTicker: "USDC";
    isQuoteCurrency: boolean;
    renegadeFeeRate: number;
    timestamp?: number;
};

/** Factory function returning query options for the savings query */
export function savingsQueryOptions(
    vars: SavingsQueryVariables,
): UseQueryOptions<SavingsData, Error, SavingsData, QueryKey> {
    const queryKey: QueryKey = ["savings", vars];

    const queryFn = async (): Promise<SavingsData> => {
        const res = await fetch("/api/savings", {
            body: JSON.stringify(vars),
            method: "POST",
        });

        if (!res.ok) throw new Error(res.statusText);

        const json = (await res.json()) as SavingsData;
        return { savings: json.savings, savingsBps: json.savingsBps };
    };

    return {
        enabled: !!Number.parseFloat(vars.amount),
        queryFn,
        queryKey,
        retry: 3,
        staleTime: 0,
    };
}
