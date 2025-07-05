import { parseAbi } from "viem";

/**
 * Canonical mainnet USDT (Tether) contract address.
 * Use lower-case for reliable, case-insensitive comparisons.
 */
export const USDT_MAINNET_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7" as const;

/**
 * USDT deviates from the ERC-20 spec by omitting the bool return value on `approve`.
 * We generate an ABI without outputs using viem's `parseAbi` helper, ensuring
 * correct typing & decoding behaviour.
 */
export const usdtAbi = parseAbi([
    // No `returns (bool)` clause
    "function approve(address spender, uint256 value)",
]);
