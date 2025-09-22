import type { ChainId } from "@renegade-fi/react/constants";
import type { erc20Abi } from "@/lib/generated";

export type RawBalance = {
    mint: `0x${string}`;
    ticker: string;
    chainId: number;
    balance: bigint;
    decimals: number;
};

export type BalanceOfContract = {
    abi: typeof erc20Abi;
    address: `0x${string}`;
    args: readonly [`0x${string}`];
    chainId: ChainId;
    functionName: "balanceOf";
};

export type PricedBalance = RawBalance & {
    usdValue: number;
};

export type BalanceData = {
    // Token ticker
    ticker: string;
    // USD value on Base
    baseUsd: number;
    // USD value on Arbitrum
    arbitrumUsd: number;
    // Total USD value
    totalUsd: number;
    // Token amount on Base
    baseAmount: bigint;
    // Token amount on Arbitrum
    arbitrumAmount: bigint;
    // Total token amount
    totalAmount: bigint;
};

export type BalanceDataWithTotal = {
    data: BalanceData[];
    totalUsd: number;
};
