import { Exchange, Token } from "@renegade-fi/react"
import { tokenMapping } from "@renegade-fi/react/constants"
import { getAddress } from "viem"

import { isTestnet } from "@/lib/viem"

export const HIDDEN_TICKERS = ["USDT", "REN"]
export const STABLECOINS = ["USDC", "USDT"]

export const DISPLAY_TOKENS = (
  options: {
    hideStables?: boolean
    hideHidden?: boolean
    hideTickers?: Array<string>
  } = {},
) => {
  const { hideStables, hideHidden = true, hideTickers = [] } = options
  let tokens = tokenMapping.tokens
  if (hideStables) {
    tokens = tokens.filter((token) => !STABLECOINS.includes(token.ticker))
  }
  if (hideHidden) {
    tokens = tokens.filter((token) => !HIDDEN_TICKERS.includes(token.ticker))
  }
  if (hideTickers.length > 0) {
    tokens = tokens.filter((token) => !hideTickers.includes(token.ticker))
  }
  return tokens
}

export const remapToken = (token: string) => {
  switch (token.toLowerCase()) {
    case "weth":
      return "eth"
    case "wbtc":
      return "btc"
    // case "usdc":
    //   return "usdt"
    default:
      return token.toLowerCase()
  }
}

export function remapQuote(exchange: Exchange) {
  switch (exchange) {
    case "binance":
    case "okx":
      return "USDT"
    case "coinbase":
    case "kraken":
      return "USD"
  }
}

export const DEFAULT_QUOTE: Record<Exchange, `0x${string}`> = {
  binance: Token.findByTicker("USDT").address,
  coinbase: Token.findByTicker("USDC").address,
  kraken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  okx: Token.findByTicker("USDT").address,
}

// TODO: Only mainnet for now
export const ADDITIONAL_TOKENS = {
  "USDC.e": new Token(
    "Bridged USDC",
    "USDC.e",
    getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
    6,
  ),
} as const
