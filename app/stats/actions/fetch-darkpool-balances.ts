"use server";

import { getSDKConfig } from "@renegade-fi/react";
import type { ChainId } from "@renegade-fi/react/constants";
import { formatUnits } from "viem";
import { arbitrum, base } from "viem/chains";
import { getServerWagmiConfig } from "@/app/lib/server-wagmi-config";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { getAllTokens } from "@/lib/token";
import { fetchAllTokenPrices, fetchChainBalances, mergeBalancesByTicker } from "./balance-helpers";
import type { BalanceData, BalanceDataWithTotal, PricedBalance, RawBalance } from "./types";

/**
 * Fetch darkpool balances across all chains with USD pricing
 * Returns aggregated balance data with total USD value
 */
export async function fetchDarkpoolBalances(
    chainId: 0 | 42161 | 8453,
): Promise<BalanceDataWithTotal> {
    try {
        if (!chainId) {
            return await fetchAllChainBalances();
        } else {
            return await fetchSingleChainBalances(chainId);
        }
    } catch (error) {
        console.error("Error fetching darkpool balances:", error);
        return createEmptyBalanceData();
    }
}

/**
 * Fetch balances for all supported chains (Arbitrum and Base)
 */
async function fetchAllChainBalances(): Promise<BalanceDataWithTotal> {
    // Step 1: Get configuration for both chains
    const arbitrumConfig = getSDKConfig(arbitrum.id);
    const baseConfig = getSDKConfig(base.id);
    const wagmiConfig = getServerWagmiConfig();

    // Step 2: Get all token mints for each chain
    const allArbitrumMints = getAllTokens(arbitrum.id);
    const allBaseMints = getAllTokens(base.id);

    // Step 3: Fetch raw balances from both chains
    const [arbitrumBalances, baseBalances] = await Promise.all([
        fetchChainBalances(
            arbitrum.id,
            arbitrumConfig.darkpoolAddress,
            allArbitrumMints,
            wagmiConfig,
        ),
        fetchChainBalances(base.id, baseConfig.darkpoolAddress, allBaseMints, wagmiConfig),
    ]);

    // Step 4: Collect all unique mint addresses for price fetching
    const allMints = collectUniqueMintAddresses(arbitrumBalances, baseBalances);

    // Step 5: Fetch USD prices for all tokens
    const prices = await fetchAllTokenPrices([...allMints]);

    // Step 6: Apply USD pricing to balances
    const pricedArbitrumBalances = applyPricingToBalances(arbitrumBalances, prices);
    const pricedBaseBalances = applyPricingToBalances(baseBalances, prices);

    // Step 7: Merge balances by ticker across chains
    const mergedBalances = mergeBalancesByTicker(pricedArbitrumBalances, pricedBaseBalances);

    // Step 8: Convert to final format and calculate totals
    const balanceData = convertMergedBalancesToData(mergedBalances);
    const totalUsd = calculateTotalUsd(balanceData);

    return {
        data: balanceData,
        totalUsd,
    };
}

/**
 * Fetch balances for a single chain
 */
async function fetchSingleChainBalances(chainId: ChainId): Promise<BalanceDataWithTotal> {
    // Step 1: Get configuration for the selected chain
    const config = getSDKConfig(chainId);
    const allMints = getAllTokens(chainId);
    const wagmiConfig = getServerWagmiConfig();

    // Step 2: Fetch raw balances from the chain
    const chainBalances = await fetchChainBalances(
        chainId,
        config.darkpoolAddress,
        allMints,
        wagmiConfig,
    );

    // Step 3: Collect mint addresses for price fetching
    const allMintAddresses = chainBalances.map((balance) => balance.mint);

    // Step 4: Fetch USD prices for all tokens
    const prices = await fetchAllTokenPrices(allMintAddresses);

    // Step 5: Apply USD pricing to balances
    const pricedBalances = applyPricingToBalances(chainBalances, prices);

    // Step 6: Convert to final format with other chain set to zero
    const balanceData = convertSingleChainBalancesToData(pricedBalances, chainId);
    const totalUsd = calculateTotalUsd(balanceData);

    return {
        data: balanceData,
        totalUsd,
    };
}

/**
 * Collect all unique mint addresses from balance arrays
 */
function collectUniqueMintAddresses(
    arbitrumBalances: RawBalance[],
    baseBalances: RawBalance[],
): Set<`0x${string}`> {
    const allMints = new Set<`0x${string}`>();

    for (const balance of arbitrumBalances) {
        allMints.add(balance.mint);
    }
    for (const balance of baseBalances) {
        allMints.add(balance.mint);
    }

    return allMints;
}

/**
 * Apply USD pricing to an array of raw balances
 */
function applyPricingToBalances(
    balances: RawBalance[],
    prices: Map<`0x${string}`, number>,
): PricedBalance[] {
    return balances.map((balance) => applyPricingToBalance(balance, prices.get(balance.mint) || 0));
}

/**
 * Apply USD pricing to a single balance
 */
function applyPricingToBalance(balance: RawBalance, price: number): PricedBalance {
    const usdValueBigInt = amountTimesPrice(balance.balance, price);
    const usdValue = Number(formatUnits(usdValueBigInt, balance.decimals));

    return {
        ...balance,
        usdValue,
    };
}

/**
 * Convert merged balances map to BalanceData array
 */
function convertMergedBalancesToData(mergedBalances: Map<string, any>): BalanceData[] {
    return Array.from(mergedBalances.entries()).map(([ticker, data]) => ({
        arbitrumAmount: data.arbitrumAmount,
        arbitrumUsd: data.arbitrumUsd,
        baseAmount: data.baseAmount,
        baseUsd: data.baseUsd,
        ticker,
        totalAmount: data.totalAmount,
        totalUsd: data.totalUsd,
    }));
}

/**
 * Convert single chain balances to BalanceData format with other chain set to zero
 */
function convertSingleChainBalancesToData(
    pricedBalances: PricedBalance[],
    chainId: number,
): BalanceData[] {
    return pricedBalances.map((balance) => ({
        arbitrumAmount: chainId === arbitrum.id ? balance.balance : BigInt(0),
        arbitrumUsd: chainId === arbitrum.id ? balance.usdValue : 0,
        baseAmount: chainId === base.id ? balance.balance : BigInt(0),
        baseUsd: chainId === base.id ? balance.usdValue : 0,
        ticker: balance.ticker,
        totalAmount: balance.balance,
        totalUsd: balance.usdValue,
    }));
}

/**
 * Calculate total USD value from balance data
 */
function calculateTotalUsd(balanceData: BalanceData[]): number {
    return balanceData.reduce((sum, row) => sum + row.totalUsd, 0);
}

/**
 * Create empty balance data for error cases
 */
function createEmptyBalanceData(): BalanceDataWithTotal {
    return {
        data: [],
        totalUsd: 0,
    };
}
