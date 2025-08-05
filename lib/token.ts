import { type Exchange, isSupportedChainId } from "@renegade-fi/react";
import type { ChainId } from "@renegade-fi/react/constants";
import { getDefaultQuoteTokenOnChain, Token } from "@renegade-fi/token-nextjs";
import { getAddress, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { env } from "@/env/client";
import { MAINNET_CHAINS, TESTNET_CHAINS } from "@/providers/wagmi-provider/config";

import { solana } from "./viem";

export const USDC_TICKER = "USDC";
export const USDT_TICKER = "USDT";

export const DISPLAY_TOKENS = (
    options: { hideQuoteTokens?: boolean; hideTickers?: Array<string>; chainId?: number } = {},
) => {
    const { hideQuoteTokens = true, hideTickers = [], chainId } = options;
    let tokens =
        chainId && isSupportedChainId(chainId)
            ? Token.getAllTokensOnChain(chainId)
            : Token.getAllTokens();
    if (hideQuoteTokens) {
        tokens = tokens.filter((token) => token.ticker !== USDC_TICKER);
    }
    if (hideTickers.length > 0) {
        tokens = tokens.filter((token) => !hideTickers.includes(token.ticker));
    }
    return tokens;
};

export const zeroAddress = "0x0000000000000000000000000000000000000000";
const DEFAULT_TOKEN = Token.create("UNKNOWN", "UNKNOWN", zeroAddress, 18, {});

/**
 * Returns the default quote token for a given mint and exchange on the chain of the mint
 */
export function getDefaultQuote(mint: `0x${string}`, exchange: Exchange) {
    const chain = resolveAddress(mint).chain;
    if (!chain) {
        return DEFAULT_TOKEN;
    }
    const quote = getDefaultQuoteTokenOnChain(chain, exchange);
    return Token.fromAddressOnChain(quote.address, chain);
}

/**
 * Returns the first token found with the given mint address
 */
export function resolveAddress(mint: `0x${string}`) {
    const tokens = Token.getAllTokens();
    const token = tokens.find((token) => isAddressEqual(token.address, mint));
    if (!token) {
        return DEFAULT_TOKEN;
    }
    return token;
}

/**
 * Returns the first token found with the given ticker
 */
export function resolveTicker(ticker: string) {
    const tokens = Token.getAllTokens();
    const token = tokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());
    if (!token) {
        return DEFAULT_TOKEN;
    }
    return token;
}

/**
 * Resolve the token from a ticker and chain id
 * @param ticker - The ticker of the token
 * @param chainId - The chain id of the token
 * @returns The token
 */
export function resolveTickerAndChain(ticker: string, chainId?: ChainId) {
    if (!chainId) return;
    return Token.fromTickerOnChain(ticker, chainId);
}

/** Get the canonical exchange of a token, capitalized */
export function getCanonicalExchange(mint: `0x${string}`) {
    const token = resolveAddress(mint);
    return token.canonicalExchange.charAt(0).toUpperCase() + token.canonicalExchange.slice(1);
}

// Arbitrum One tokens
export const ADDITIONAL_TOKENS = {
    "USDC.e": Token.create(
        "Bridged USDC",
        "USDC.e",
        getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
        6,
    ),
} as const;

// Solana tokens
export const SOLANA_TOKENS = Object.fromEntries(
    Token.getAllTokens()
        .filter((t) => {
            if (!t.chainAddresses) return false;

            return Object.keys(t.chainAddresses).some(
                (chainId) => chainId === solana.id.toString(),
            );
        })
        .map((t) => [t.ticker, t.chainAddresses[solana.id.toString()]]),
);

// Ethereum Mainnet tokens
export const ETHEREUM_TOKENS = Object.fromEntries(
    Token.getAllTokens()
        .filter((t) => {
            if (!t.chainAddresses) return false;

            return Object.keys(t.chainAddresses).some(
                (chainId) => chainId === mainnet.id.toString(),
            );
        })
        .map((t) => [
            t.ticker,
            Token.create(
                t.name,
                t.ticker,
                t.chainAddresses[mainnet.id.toString()] as `0x${string}`,
                t.decimals,
            ),
        ]),
);

/** Returns whether or not a token is supported on a given exchange */
export function isSupportedExchange(mint: `0x${string}`, exchange: Exchange) {
    // Renegade routes to the canonical exchange so it is always valid
    if (exchange === "renegade") return true;
    const token = resolveAddress(mint);
    const supportedExchanges = token.supportedExchanges;
    return supportedExchanges.has(exchange);
}

/** Returns true if the ticker exists on all chains, false otherwise */
export function isAddressMultiChain(mint: `0x${string}`) {
    return isTickerMultiChain(resolveAddress(mint).ticker);
}

/** Returns true if the ticker exists on all chains, false otherwise */
export function isTickerMultiChain(ticker: string) {
    const chains =
        env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "testnet" ? TESTNET_CHAINS : MAINNET_CHAINS;
    for (const chain of chains) {
        const token = resolveTickerAndChain(ticker, chain.id);
        if (!token || token.address === zeroAddress) return false;
    }
    return true;
}
