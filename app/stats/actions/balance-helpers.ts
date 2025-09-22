import type { ChainId } from "@renegade-fi/react/constants";
import type { Config } from "wagmi";
import { multicall } from "wagmi/actions";
import { client } from "@/lib/clients/price-reporter";
import { erc20Abi } from "@/lib/generated";
import type { TokenInstance } from "@/lib/token";
import type { BalanceData, BalanceOfContract, PricedBalance, RawBalance } from "./types";

// --------------------
// | Balance Fetching |
// --------------------

function createBalanceFromToken(
    token: TokenInstance,
    chainId: number,
    balance: bigint,
): RawBalance {
    return {
        balance,
        chainId,
        decimals: token.decimals,
        mint: token.address,
        ticker: token.ticker,
    };
}

function createZeroBalanceFromToken(token: TokenInstance, chainId: number): RawBalance {
    return createBalanceFromToken(token, chainId, BigInt(0));
}

/**
 * Create multicall contracts array for ERC20 balanceOf calls
 */
function createBalanceOfContracts(
    tokens: TokenInstance[],
    owner: `0x${string}`,
    chainId: ChainId,
): BalanceOfContract[] {
    return tokens.map((token) => ({
        abi: erc20Abi,
        address: token.address,
        args: [owner] as const,
        chainId,
        functionName: "balanceOf" as const,
    }));
}

/**
 * Fetch balances for specified tokens on a specific chain using multicall
 *
 * This function optimizes balance fetching by batching multiple ERC20 balanceOf calls
 * into a single multicall request, reducing RPC calls from N to 1 where N is the
 * number of tokens. This significantly improves performance and reduces rate limiting.
 */
export async function fetchChainBalances(
    chainId: ChainId,
    owner: `0x${string}`,
    tokens: TokenInstance[],
    wagmiConfig: Config,
): Promise<RawBalance[]> {
    if (tokens.length === 0) {
        return [];
    }

    const balanceOfContracts = createBalanceOfContracts(tokens, owner, chainId);

    try {
        const multicallResults = await multicall(wagmiConfig, {
            allowFailure: true, // Continue even if some calls fail
            chainId,
            contracts: balanceOfContracts,
        });

        // Map results back to RawBalance format with preserved type inference
        return multicallResults.map((result, index: number) => {
            const token = tokens[index];
            const isSuccess = result.status === "success";

            if (isSuccess) {
                const balance = result.result;
                return createBalanceFromToken(token, chainId, balance);
            } else {
                console.error(
                    `Error fetching balance for ${token.ticker} on chain ${chainId}:`,
                    result.error,
                );
                return createZeroBalanceFromToken(token, chainId);
            }
        });
    } catch (error) {
        console.error(`Error in multicall for chain ${chainId}:`, error);
        // Return zero balances for all tokens if multicall fails
        return tokens.map((token) => createZeroBalanceFromToken(token, chainId));
    }
}

// ------------------
// | Price Fetching |
// ------------------

/**
 * Fetch USD prices for all tokens using the price reporter client
 */
export async function fetchAllTokenPrices(
    mints: `0x${string}`[],
): Promise<Map<`0x${string}`, number>> {
    const pricePromises = mints.map(fetchTokenPrice);
    const priceResults = await Promise.all(pricePromises);
    return buildPriceMap(priceResults);
}

async function fetchTokenPrice(
    mint: `0x${string}`,
): Promise<{ mint: `0x${string}`; price: number }> {
    try {
        const price = await client.getPrice(mint);
        return { mint, price };
    } catch (error) {
        console.error(`Error fetching price for ${mint}:`, error);
        return { mint, price: 0 };
    }
}

function buildPriceMap(
    priceResults: { mint: `0x${string}`; price: number }[],
): Map<`0x${string}`, number> {
    const prices = new Map<`0x${string}`, number>();
    priceResults.forEach(({ mint, price }) => {
        prices.set(mint, price);
    });
    return prices;
}

// -----------
// | Merging |
// -----------

/**
 * Merge balances by ticker across chains
 */
export function mergeBalancesByTicker(
    arbitrumBalances: PricedBalance[],
    baseBalances: PricedBalance[],
): Map<string, BalanceData> {
    const merged = new Map<string, BalanceData>();

    // Process Arbitrum balances
    for (const balance of arbitrumBalances) {
        const existing = merged.get(balance.ticker) || {
            arbitrumAmount: BigInt(0),
            arbitrumUsd: 0,
            baseAmount: BigInt(0),
            baseUsd: 0,
            ticker: balance.ticker,
            totalAmount: BigInt(0),
            totalUsd: 0,
        };
        existing.arbitrumUsd += balance.usdValue;
        existing.totalUsd += balance.usdValue;
        existing.arbitrumAmount += balance.balance;
        existing.totalAmount += balance.balance;
        merged.set(balance.ticker, existing);
    }

    // Process Base balances
    for (const balance of baseBalances) {
        const existing = merged.get(balance.ticker) || {
            arbitrumAmount: BigInt(0),
            arbitrumUsd: 0,
            baseAmount: BigInt(0),
            baseUsd: 0,
            ticker: balance.ticker,
            totalAmount: BigInt(0),
            totalUsd: 0,
        };
        existing.baseUsd += balance.usdValue;
        existing.totalUsd += balance.usdValue;
        existing.baseAmount += balance.balance;
        existing.totalAmount += balance.balance;
        merged.set(balance.ticker, existing);
    }

    return merged;
}
