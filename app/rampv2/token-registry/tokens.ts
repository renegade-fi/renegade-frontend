import { getAddress } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { solana } from "@/lib/viem";
import type { Token } from "./registry";

/**
 * Tokens that are NOT supplied by the Renegade TokenClass map.
 */
export const RAMP_TOKENS = {
    [arbitrum.id]: {
        ETH: {
            address: "0x0000000000000000000000000000000000000000",
            decimals: 18,
            ticker: "ETH",
            name: "Ethereum",
            canDeposit: false,
            canWithdraw: false,
            canSwap: true,
            swapInto: ["WETH"],
            canBridge: false,
        },
        "USDC.e": {
            address: getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
            decimals: 6,
            ticker: "USDC.e",
            name: "Bridged USDC",
            canDeposit: false,
            canWithdraw: false,
            canSwap: true,
            swapInto: ["USDC"],
            canBridge: false,
        },
        USDT: {
            name: "Tether USD",
            ticker: "USDT",
            address: getAddress("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"),
            decimals: 6,
            canDeposit: false,
            canWithdraw: false,
            canSwap: true,
            swapInto: ["USDC"],
            canBridge: false,
        },
    },
    [base.id]: {
        ETH: {
            address: "0x0000000000000000000000000000000000000000",
            decimals: 18,
            ticker: "ETH",
            name: "Ethereum",
            canDeposit: false,
            canWithdraw: false,
            canSwap: true,
            swapInto: ["WETH"],
            canBridge: false,
        },
    },
    [mainnet.id]: {
        USDC: {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            decimals: 6,
            ticker: "USDC",
            name: "USD Coin",
            canDeposit: false,
            canWithdraw: false,
            canSwap: false,
            swapInto: [],
            canBridge: true,
        },
    },
    [solana.id]: {
        USDC: {
            address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
            ticker: "USDC",
            name: "USD Coin",
            canDeposit: false,
            canWithdraw: false,
            canSwap: false,
            swapInto: [],
            canBridge: true,
        },
    },
} as const satisfies Record<number, Record<string, ExtraToken>>;

// ExtraToken omits chainId because it will be derived from the outer key
type ExtraToken = Omit<Token, "chainId" | "address"> & { address: string };
