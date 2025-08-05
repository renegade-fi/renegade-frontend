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
            bridgeTo: {},
            canDeposit: false,
            canWithdraw: false,
            decimals: 18,
            name: "Ethereum",
            swapTo: "WETH",
            ticker: "ETH",
        },
        "USDC.e": {
            address: getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
            bridgeTo: {},
            canDeposit: false,
            canWithdraw: false,
            decimals: 6,
            name: "Bridged USDC",
            swapTo: "USDC",
            ticker: "USDC.e",
        },
    },
    [base.id]: {
        ETH: {
            address: "0x0000000000000000000000000000000000000000",
            bridgeTo: {},
            canDeposit: false,
            canWithdraw: false,
            decimals: 18,
            name: "Ethereum",
            swapTo: "WETH",
            ticker: "ETH",
        },
    },
    [mainnet.id]: {
        USDC: {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            bridgeTo: {
                [arbitrum.id]: "USDC",
                [base.id]: "USDC",
            },
            canDeposit: false,
            canWithdraw: false,
            decimals: 6,
            name: "USD Coin",
            swapTo: undefined,
            ticker: "USDC",
        },
        WBTC: {
            address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
            bridgeTo: {
                [arbitrum.id]: "WBTC",
                [base.id]: "cbBTC",
            },
            canDeposit: false,
            canWithdraw: false,
            decimals: 8,
            name: "Wrapped Bitcoin",
            swapTo: undefined,
            ticker: "WBTC",
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
            bridgeTo: {
                [arbitrum.id]: "USDC",
                [base.id]: "USDC",
            },
            canDeposit: false,
            canWithdraw: false,
            decimals: 6,
            name: "USD Coin",
            swapTo: undefined,
            ticker: "USDC",
        },
    },
} as const satisfies Record<number, Record<string, ExtraToken>>;

// ExtraToken omits chainId because it will be derived from the outer key
type ExtraToken = Omit<Token, "chainId" | "address"> & { address: string };

/**
 * Capability overrides for tokens already provided by Renegade's TokenClass map.
 * Only include fields that differ from the defaults set in convertTokenInstance.
 */
export const RENEGADE_OVERRIDES: Record<number, Record<string, Partial<Token>>> = {};
