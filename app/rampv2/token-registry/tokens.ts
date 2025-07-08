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
            swapTo: "WETH",
            bridgeTo: {},
        },
        "USDC.e": {
            address: getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
            decimals: 6,
            ticker: "USDC.e",
            name: "Bridged USDC",
            canDeposit: false,
            canWithdraw: false,
            swapTo: "USDC",
            bridgeTo: {},
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
            swapTo: "WETH",
            bridgeTo: {},
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
            swapTo: undefined,
            bridgeTo: {
                [arbitrum.id]: "USDC",
                [base.id]: "USDC",
            },
        },
        WBTC: {
            address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
            decimals: 8,
            ticker: "WBTC",
            name: "Wrapped Bitcoin",
            canDeposit: false,
            canWithdraw: false,
            swapTo: undefined,
            bridgeTo: {
                [arbitrum.id]: "WBTC",
                [base.id]: "cbBTC",
            },
        },
        // TODO: Enable once Across bridging only native ETH is solved
        // WETH: {
        //     address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        //     decimals: 18,
        //     ticker: "WETH",
        //     name: "Wrapped Ether",
        //     canDeposit: false,
        //     canWithdraw: false,
        //     swapTo: undefined,
        //     bridgeTo: {
        //         [arbitrum.id]: "WETH",
        //         [base.id]: "WETH",
        //     },
        // },
    },
    [solana.id]: {
        USDC: {
            address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            decimals: 6,
            ticker: "USDC",
            name: "USD Coin",
            canDeposit: false,
            canWithdraw: false,
            swapTo: undefined,
            bridgeTo: {
                [arbitrum.id]: "USDC",
                [base.id]: "USDC",
            },
        },
    },
} as const satisfies Record<number, Record<string, ExtraToken>>;

// ExtraToken omits chainId because it will be derived from the outer key
type ExtraToken = Omit<Token, "chainId" | "address"> & { address: string };

/**
 * Capability overrides for tokens already provided by Renegade's TokenClass map.
 * Only include fields that differ from the defaults set in convertTokenInstance.
 */
export const RENEGADE_OVERRIDES: Record<number, Record<string, Partial<Token>>> = {
    [arbitrum.id]: {
        USDT: {
            canDeposit: true,
            canWithdraw: false,
            swapTo: "USDC",
            bridgeTo: {},
        },
    },
};
