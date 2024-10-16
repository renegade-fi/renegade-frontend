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

// Arbitrum One tokens
export const ADDITIONAL_TOKENS = {
  "USDC.e": new Token(
    "Bridged USDC",
    "USDC.e",
    getAddress("0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"),
    6,
  ),
} as const

// Ethereum Mainnet tokens
export const ETHEREUM_TOKENS = {
  WBTC: new Token(
    "Wrapped BTC",
    "WBTC",
    getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"),
    8,
  ),
  WETH: new Token(
    "Wrapped Ether",
    "WETH",
    getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
    18,
  ),
  PENDLE: new Token(
    "Pendle",
    "PENDLE",
    getAddress("0x808507121b80c02388fad14726482e061b8da827"),
    18,
  ),
  LDO: new Token(
    "Lido DAO Token",
    "LDO",
    getAddress("0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32"),
    18,
  ),
  LINK: new Token(
    "ChainLink Token",
    "LINK",
    getAddress("0x514910771AF9Ca656af840dff83E8264EcF986CA"),
    18,
  ),
  CRV: new Token(
    "Curve DAO Token",
    "CRV",
    getAddress("0xD533a949740bb3306d119CC777fa900bA034cd52"),
    18,
  ),
  UNI: new Token(
    "Uniswap",
    "UNI",
    getAddress("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"),
    18,
  ),
  ZRO: new Token(
    "LayerZero",
    "ZRO",
    getAddress("0x6985884C4392D348587B19cb9eAAf157F13271cd"),
    18,
  ),
  LPT: new Token(
    "Livepeer Token",
    "LPT",
    getAddress("0x58b6A8A3302369DAEc383334672404Ee733aB239"),
    18,
  ),
  GRT: new Token(
    "Graph Token",
    "GRT",
    getAddress("0xc944E90C64B2c07662A292be6244BDf05Cda44a7"),
    18,
  ),
  COMP: new Token(
    "Compound",
    "COMP",
    getAddress("0x354a6da3fcde098f8389cad84b0182725c6c91de"),
    18,
  ),
  AAVE: new Token(
    "Aave Token",
    "AAVE",
    getAddress("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"),
    18,
  ),
  RDNT: new Token(
    "Radiant",
    "RDNT",
    getAddress("0x137dDB47Ee24EaA998a535Ab00378d6BFa84F893"),
    18,
  ),
  ETHFI: new Token(
    "Ether.fi",
    "ETHFI",
    getAddress("0xFe0c30065B384F05761f15d0CC899D4F9F9Cc0eB"),
    18,
  ),
} as const
