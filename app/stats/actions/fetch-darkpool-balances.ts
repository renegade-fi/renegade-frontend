"use server";

import { getSDKConfig } from "@renegade-fi/react";
import { formatUnits } from "viem";
import { arbitrum, base } from "viem/chains";
import { getServerWagmiConfig } from "@/app/lib/server-wagmi-config";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { getAllTokens } from "@/lib/token";
import { fetchAllTokenPrices, fetchChainBalances, mergeBalancesByTicker } from "./balance-helpers";
import type { BalanceData, BalanceDataWithTotal, PricedBalance, RawBalance } from "./types";

/**
 * Fetch darkpool balances across all chains with USD pricing
 */
export async function fetchDarkpoolBalances(): Promise<BalanceDataWithTotal> {
    try {
        // Get darkpool addresses for each chain
        const arbitrumConfig = getSDKConfig(arbitrum.id);
        const baseConfig = getSDKConfig(base.id);

        const arbitrumDarkpoolAddress = arbitrumConfig.darkpoolAddress;
        const baseDarkpoolAddress = baseConfig.darkpoolAddress;

        // Get tokens and config for balance fetching
        const allArbitrumMints = getAllTokens(arbitrum.id);
        const allBaseMints = getAllTokens(base.id);
        const wagmiConfig = getServerWagmiConfig();

        // Fetch balances first to get all mint addresses
        const [arbitrumBalances, baseBalances] = await Promise.all([
            fetchChainBalances(arbitrum.id, arbitrumDarkpoolAddress, allArbitrumMints, wagmiConfig),
            fetchChainBalances(base.id, baseDarkpoolAddress, allBaseMints, wagmiConfig),
        ]);

        // Collect all unique mint addresses
        const allMints = new Set<`0x${string}`>();
        for (const balance of arbitrumBalances) {
            allMints.add(balance.mint);
        }
        for (const balance of baseBalances) {
            allMints.add(balance.mint);
        }

        // Fetch prices for all unique mints
        const prices = await fetchAllTokenPrices([...allMints]);

        // Apply USD pricing
        const pricedArbitrumBalances = arbitrumBalances.map((balance) =>
            applyPricingToBalance(balance, prices.get(balance.mint) || 0),
        );
        const pricedBaseBalances = baseBalances.map((balance) =>
            applyPricingToBalance(balance, prices.get(balance.mint) || 0),
        );

        // Merge balances by ticker
        const mergedBalances = mergeBalancesByTicker(pricedArbitrumBalances, pricedBaseBalances);

        // Convert to final format
        const balanceData: BalanceData[] = Array.from(mergedBalances.entries()).map(
            ([ticker, data]) => ({
                arbitrumAmount: data.arbitrumAmount,
                arbitrumUsd: data.arbitrumUsd,
                baseAmount: data.baseAmount,
                baseUsd: data.baseUsd,
                ticker,
                totalAmount: data.totalAmount,
                totalUsd: data.totalUsd,
            }),
        );

        // Calculate total USD server-side
        const totalUsd = balanceData.reduce((sum, row) => sum + row.totalUsd, 0);

        return {
            data: balanceData,
            totalUsd,
        };
    } catch (error) {
        console.error("Error fetching darkpool balances:", error);
        return {
            data: [],
            totalUsd: 0,
        };
    }
}

// Helper to apply pricing to a single balance
function applyPricingToBalance(balance: RawBalance, price: number): PricedBalance {
    const usdValueBigInt = amountTimesPrice(balance.balance, price);
    const usdValue = Number(formatUnits(usdValueBigInt, balance.decimals));

    return {
        ...balance,
        usdValue,
    };
}
