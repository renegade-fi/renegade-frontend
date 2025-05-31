import { Exchange } from "@renegade-fi/react"
import { ChainId } from "@renegade-fi/react/constants"
import { getDefaultQuoteTokenOnChain, Token } from "@renegade-fi/token-nextjs"
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
    tokens = tokens.filter(
      (token) => !Token.findByAddress(token.address).isStablecoin(),
    )
  }
  if (hideHidden) {
    tokens = tokens.filter((token) => !HIDDEN_TICKERS.includes(token.ticker))
  }
  if (hideTickers.length > 0) {
    tokens = tokens.filter((token) => !hideTickers.includes(token.ticker))
  }
  return tokens
}

const DEFAULT_TOKEN = Token.create(
  "UNKNOWN",
  "UNKNOWN",
  "0x0000000000000000000000000000000000000000",
  18,
  {},
)

/**
 * Returns the default quote token for a given mint and exchange on the chain of the mint
 */
export function getDefaultQuote(mint: `0x${string}`, exchange: Exchange) {
  const chain = resolveAddress(mint).chain
  if (!chain) {
    return DEFAULT_TOKEN
  }
  const quote = getDefaultQuoteTokenOnChain(chain, exchange)
  return Token.fromAddressOnChain(quote.address, chain)
}

/**
 * Returns the first token found with the given mint address
 */
export function resolveAddress(mint: `0x${string}`) {
  const tokens = Token.getAllTokens()
  const token = tokens.find((token) => isAddressEqual(token.address, mint))
  if (!token) {
    return DEFAULT_TOKEN
  }
  return token
}

/**
 * Returns the first token found with the given ticker
 */
export function resolveTicker(ticker: string) {
  const tokens = Token.getAllTokens()
  const token = tokens.find((token) => token.ticker === ticker)
  if (!token) {
    return DEFAULT_TOKEN
  }
  return token
}

/**
 * Resolve the token from a ticker and chain id
 * @param ticker - The ticker of the token
 * @param chainId - The chain id of the token
 * @returns The token
 */
export function resolveTickerAndChain(ticker: string, chainId?: ChainId) {
  if (!chainId) return
  return Token.fromTickerOnChain(ticker, chainId)
}

export const remapToken = (mint: `0x${string}`) => {
  const token = resolveAddress(mint)
  const remapped = token.getExchangeTicker("binance") || token.ticker
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
