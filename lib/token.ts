import { Exchange, Token } from "@renegade-fi/react"
import { tokenMapping } from "@renegade-fi/react/constants"

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
    tokens = tokens.filter(token => !STABLECOINS.includes(token.ticker))
  }
  if (hideHidden) {
    tokens = tokens.filter(token => !HIDDEN_TICKERS.includes(token.ticker))
  }
  if (hideTickers.length > 0) {
    tokens = tokens.filter(token => !hideTickers.includes(token.ticker))
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

export const DEFAULT_QUOTE: Record<Exchange, `0x${string}`> = {
  binance: Token.findByTicker("USDT").address,
  coinbase: Token.findByTicker("USDC").address,
  kraken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  okx: Token.findByTicker("USDT").address,
}
