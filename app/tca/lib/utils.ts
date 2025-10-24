import { type ClassValue, clsx } from "clsx";
import numeral from "numeral";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format USDC value with commas and conditional decimal places
 * Shows 2 decimals only if value has decimals, otherwise whole number
 */
export function formatUSDC(value: number): string {
    const format = "0,0[.]00";
    return numeral(value).format(format);
}

/**
 * Format receive amount based on ticker
 * USDC uses formatUSDC, other tokens show up to 4 decimals without trailing zeros
 */
export function formatReceiveAmount(amount: number, ticker: string): string {
    if (ticker === "USDC") {
        return formatUSDC(amount);
    }
    return numeral(amount).format("0,0.[0000]");
}

/**
 * Format token amount with appropriate precision
 * Uses higher precision for small values, lower for large values
 */
export function formatTokenAmount(value: number): string {
    // For very small values (< 0.01), use more decimals
    if (value < 0.01 && value > 0) {
        return numeral(value).format("0,0.0000");
    }
    // For small values (< 1), use 4 decimals
    if (value < 1) {
        return numeral(value).format("0,0.0000");
    }
    // For medium values (< 1000), use 2 decimals
    if (value < 1000) {
        return numeral(value).format("0,0.00");
    }
    // For larger values, use conditional decimals
    const hasDecimals = value % 1 !== 0;
    const format = hasDecimals ? "0,0.00" : "0,0";
    return numeral(value).format(format);
}

/**
 * Encode basic auth credentials for use in HTTP headers
 *
 * @param username - The username to encode
 * @param password - The password to encode
 * @returns The encoded credentials
 */
export function encodeBasicAuthCredentials(username: string, password: string) {
    return Buffer.from(`${username}:${password}`, "utf8").toString("base64");
}

/**
 * Convert a decimal amount to a raw amount
 * @param amount - The decimal amount
 * @param decimals - The number of decimals
 * @returns The raw amount
 */
export function convertDecimalToRaw(amount: number, decimals: number): bigint {
    return BigInt(Math.floor(amount * 10 ** decimals));
}

// Canonicalization helpers for stable parameter serialization
// (canonicalization helpers moved into TwapParams)
