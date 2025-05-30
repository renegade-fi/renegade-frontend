import { ChainId } from "@renegade-fi/react/constants"
import { Token } from "@renegade-fi/token-nextjs"
import { getAddress, isAddressEqual } from "viem"
import { mainnet } from "viem/chains"

import { solana } from "./viem"

export const HIDDEN_TICKERS = ["USDT", "REN"]

export const DISPLAY_TOKENS = (
  options: {
    hideStables?: boolean
    hideHidden?: boolean
    hideTickers?: Array<string>
    chainId?: ChainId
  } = {},
) => {
  const { hideStables, hideHidden = true, hideTickers = [], chainId } = options
  let tokens = chainId
    ? Token.getAllTokensOnChain(chainId)
    : Token.getAllTokens()
  if (hideStables) {
    tokens = tokens.filter((token) => !token.isStablecoin())
  }
  if (hideHidden) {
    tokens = tokens.filter((token) => !HIDDEN_TICKERS.includes(token.ticker))
  }
  if (hideTickers.length > 0) {
    tokens = tokens.filter((token) => !hideTickers.includes(token.ticker))
  }
  return tokens
}

/**
 * Resolve the token address for a given mint across all chains
 * @param mint - The mint address
 * @returns The token address
 */
export function resolveAddress(mint: `0x${string}`) {
  const tokens = Token.getAllTokens()
  const token = tokens.find((token) => isAddressEqual(token.address, mint))
  // TODO: Return default token if not found
  if (!token) {
    return Token.create("Unsupported Token", "--", mint, 18, {})
  }
  return token
}

/**
 * Returns the first matching token across all configured remaps
 * @param ticker - The ticker of the token
 * @param chainId - The chain id of the token
 * @returns The token
 */
export function resolveTickerOnChain(ticker: string, chainId?: ChainId) {
  if (!chainId) return
  return Token.fromTickerOnChain(ticker, chainId)
}

/**
 * Returns the first matching token across all configured remaps
 * @param ticker - The ticker of the token
 * @returns The token
 */
export function resolveTicker(ticker: string) {
  const tokens = Token.getAllTokens()
  const token = tokens.find((token) => token.ticker === ticker)
  if (!token) {
    return Token.create(
      "Unsupported Token",
      ticker,
      "0x0000000000000000000000000000000000000000",
      18,
      {},
    )
  }
  return token
}

export const remapToken = (ticker: string) => {
  const token = resolveTicker(ticker.toUpperCase())
  const remapped = token.getExchangeTicker("binance") || ticker
  return remapped.toLowerCase()
}

// Arbitrum One tokens
export const ADDITIONAL_TOKENS = {
  "USDC.e": Token.create(
    "Bridged USDC",
    "USDC.e",
    getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
    6,
  ),
} as const

// Solana tokens
export const SOLANA_TOKENS = Object.fromEntries(
  Token.getAllTokens()
    .filter((t) => {
      if (!t.chainAddresses) return false

      return Object.keys(t.chainAddresses).some(
        (chainId) => chainId === solana.id.toString(),
      )
    })
    .map((t) => [t.ticker, t.chainAddresses[solana.id.toString()]]),
)

// Ethereum Mainnet tokens
export const ETHEREUM_TOKENS = Object.fromEntries(
  Token.getAllTokens()
    .filter((t) => {
      if (!t.chainAddresses) return false

      return Object.keys(t.chainAddresses).some(
        (chainId) => chainId === mainnet.id.toString(),
      )
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
)
