import type { Config } from "@renegade-fi/react/";
import { getBackOfQueueWallet } from "@renegade-fi/react/actions";
import { MAX_BALANCES } from "@renegade-fi/react/constants";
import { queryOptions } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { formatNumber } from "@/lib/format";
import { getTokenByAddress } from "../token-registry";

export interface QueryParams {
    renegadeConfig: Config;
}

export interface QueryParamsWithMint extends QueryParams {
    mint: string;
}

// Base query builder that handles the common structure
function createBackOfQueueWalletQuery<T>(
    params: QueryParams,
    selectFn: (data: Awaited<ReturnType<typeof getBackOfQueueWallet>>) => T,
) {
    return queryOptions({
        queryFn: async () => {
            return getBackOfQueueWallet(params.renegadeConfig);
        },
        queryKey: [
            "back-of-queue-wallet",
            {
                scopeKey: params.renegadeConfig.state.id,
            },
        ],
        select: selectFn,
        staleTime: 0,
    });
}

/** Returns the balance of the given mint in the back of queue wallet. */
export function renegadeBalanceQuery(params: QueryParamsWithMint) {
    return createBackOfQueueWalletQuery(params, (data) => {
        const raw = data.balances.find((b) => b.mint === params.mint)?.amount ?? BigInt(0);
        const maybeToken = getTokenByAddress(params.mint, params.renegadeConfig.state.chainId!);
        if (!maybeToken) return { decimalCorrected: "0", raw, rounded: "0", ticker: "" };
        const decimalCorrected = formatUnits(raw, maybeToken.decimals);
        const rounded = formatNumber(raw, maybeToken.decimals);
        return {
            decimalCorrected,
            isZero: raw === BigInt(0),
            raw,
            rounded,
            ticker: maybeToken.ticker,
        };
    });
}

/** Returns true if the back of queue wallet can not deposit the given mint because it is at max balances and the mint is not already in the wallet.*/
export function maxBalancesQuery(params: QueryParamsWithMint) {
    return createBackOfQueueWalletQuery(params, (data) => {
        const nonDefaultBalances = data.balances.filter(
            (b) => b.amount || b.protocol_fee_balance || b.relayer_fee_balance,
        );
        const numBalances = nonDefaultBalances.length;
        const isMax = numBalances >= MAX_BALANCES;
        const exists = nonDefaultBalances.some(
            (b) => b.mint.toLowerCase() === params.mint.toLowerCase(),
        );
        return isMax && !exists;
    });
}

/** Returns the number of fees in the back of queue wallet. */
export function numFeesQuery(params: QueryParams) {
    return createBackOfQueueWalletQuery(params, (data) => {
        return data.balances.filter((b) => b.protocol_fee_balance || b.relayer_fee_balance).length;
    });
}
