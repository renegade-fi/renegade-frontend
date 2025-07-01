import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import type { TokenInstance } from "./token-rules";

// Tokens that Renegade itself cannot deposit/withdraw but we still need
// metadata for – e.g. as swap *inputs* only.

export const BRIDGED_TOKENS: TokenInstance[] = [
    TokenClass.create(
        "Bridged USD Coin",
        "USDC.e",
        "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        6,
        {},
        {},
        "",
        42161,
    ) as TokenInstance,
    TokenClass.create(
        "Tether USD",
        "USDT",
        "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        6,
        {},
        {},
        "",
        42161,
    ) as TokenInstance,
];
