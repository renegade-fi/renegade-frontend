import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
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

/**
 * Convert a raw amount string to a decimal number
 * @param raw - The raw amount as a string
 * @param decimals - The number of decimals
 * @returns The decimal amount as a number
 */
export function formatUnitsToNumber(raw: string, decimals: number): number {
    if (!raw) return 0;

    try {
        const rawBigInt = BigInt(raw);
        const divisor = BigInt(10 ** decimals);
        const integerPart = rawBigInt / divisor;
        const fractionalPart = rawBigInt % divisor;

        // Convert to decimal number
        const result = Number(integerPart) + Number(fractionalPart) / Number(divisor);
        return result;
    } catch {
        // Fallback for invalid input
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    }
}
