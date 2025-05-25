import { Token } from "@renegade-fi/token-nextjs"
import { getAddress } from "viem"
import { mainnet } from "viem/chains"

import { solana } from "./viem"

export const HIDDEN_TICKERS = ["USDT", "REN"]

export const DISPLAY_TOKENS = (
  options: {
    hideStables?: boolean
    hideHidden?: boolean
    hideTickers?: Array<string>
  } = {},
) => {
  const { hideStables, hideHidden = true, hideTickers = [] } = options
  let tokens = Token.getAllTokens()
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

export const remapToken = (ticker: string) => {
  const token = Token.findByTicker(ticker.toUpperCase())
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
