import type { Config } from "@renegade-fi/react/";
import { getBackOfQueueWallet } from "@renegade-fi/react/actions";
import { queryOptions } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { formatNumber } from "@/lib/format";
import { getTokenByAddress } from "../token-registry";

export interface QueryParams {
    mint: string;
    renegadeConfig: Config;
}

export function renegadeBalanceQuery(params: QueryParams) {
    return queryOptions({
        queryKey: [
            "back-of-queue-wallet",
            {
                scopeKey: params.renegadeConfig.state.id,
            },
        ],
        queryFn: async () => {
            return getBackOfQueueWallet(params.renegadeConfig);
        },
        select: (data) => {
            const raw = data.balances.find((b) => b.mint === params.mint)?.amount ?? BigInt(0);
            const maybeToken = getTokenByAddress(params.mint, params.renegadeConfig.state.chainId!);
            if (!maybeToken) return { raw, decimalCorrected: "0", rounded: "0", ticker: "" };
            const decimalCorrected = formatUnits(raw, maybeToken.decimals);
            const rounded = formatNumber(raw, maybeToken.decimals);
            return {
                raw,
                decimalCorrected,
                rounded,
                ticker: maybeToken.ticker,
                isZero: raw === BigInt(0),
            };
        },
        staleTime: 0,
    });
}
