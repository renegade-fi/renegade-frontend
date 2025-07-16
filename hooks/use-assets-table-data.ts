import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatUnits } from "viem/utils";
import { useAccount } from "wagmi";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useOnChainBalances } from "@/hooks/use-on-chain-balances";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { resolveAddress } from "@/lib/token";
import { priceQueryOptions } from "./use-price-query";

export type AssetsTableRow = {
    mint: `0x${string}`;
    rawRenegadeBalance: bigint;
    renegadeBalance: number;
    renegadeUsdValue: string;
    rawOnChainBalance: bigint;
    onChainBalance: number;
    onChainUsdValue: string;
};

interface UseAssetsTableDataOptions {
    /** Token mint addresses to display in the assets table */
    mints: `0x${string}`[];
}

export function useAssetsTableData({ mints }: UseAssetsTableDataOptions) {
    const { address } = useAccount();
    const { data: renegadeBalances } = useBackOfQueueWallet({
        query: {
            select: (data) =>
                new Map(data.balances.map((balance) => [balance.mint, balance.amount])),
        },
    });

    const { data: onChainBalances } = useOnChainBalances({
        address,
        mints,
    });

    const priceResults = useQueries({
        queries: mints.map((mint) => ({
            ...priceQueryOptions(mint, undefined /** exchange */, true /** isSnapshot */),
            refetchInterval: 5000,
        })),
        combine: (results) => {
            const map = new Map<`0x${string}`, number>();
            results.forEach((result, i) => {
                map.set(mints[i], result.data ?? 0);
            });
            return map;
        },
    });

    const tableData = useMemo(() => {
        return mints.map((mint, i) => {
            const token = resolveAddress(mint);
            const renegadeBalance = renegadeBalances?.get(mint) ?? BigInt(0);
            const price = priceResults.get(mint) ?? 0;
            const renegadeUsdValueBigInt = amountTimesPrice(renegadeBalance, price);
            const renegadeUsdValue = formatUnits(renegadeUsdValueBigInt, token.decimals);

            const onChainBalance = onChainBalances?.get(mint) ?? BigInt(0);
            const onChainUsdValueBigInt = amountTimesPrice(onChainBalance, price);
            const onChainUsdValue = formatUnits(onChainUsdValueBigInt, token.decimals);

            return {
                mint,
                rawRenegadeBalance: renegadeBalance,
                renegadeBalance: Number(formatUnits(renegadeBalance, token.decimals)),
                renegadeUsdValue,
                rawOnChainBalance: onChainBalance,
                onChainBalance: Number(formatUnits(onChainBalance, token.decimals)),
                onChainUsdValue,
            };
        });
    }, [mints, onChainBalances, priceResults, renegadeBalances]);

    return tableData;
}
