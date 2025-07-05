import { getTokenByAddress } from "./token-registry";

/**
 * Returns true if the token is ETH.
 *
 * If no token is found, returns false.
 */
export function isETH(mint: string, chainId: number) {
    const token = getTokenByAddress(mint, chainId);
    return token?.ticker === "ETH";
}
