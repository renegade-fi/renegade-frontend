// Constants
import { Exchange, Token } from "@renegade-fi/react"
import { parseUnits } from "viem/utils"

// Min fill size of the quote asset that the relayer will accept
export const MIN_FILL_SIZE = parseUnits(
  "1",
  Token.findByTicker("USDT").decimals,
)
// TODO: [CORRECTNESS] Should fetch from relayer
// Default mint
export const DEFAULT_MINT = "0x0000000000000000000000000000000000000000"
// Renegade protocol fee
export const PROTOCOL_FEE = 0.0002
// Renegade relayer fee
export const RELAYER_FEE = 0.0002
// Binance base fee
export const BINANCE_BASE_FEE = 0.001
// Minimum deposit amount (in USD)
export const MIN_DEPOSIT_AMOUNT = 1

// Types

// Side
export enum Side {
  BUY = "buy",
  SELL = "sell",
}

export const EXCHANGES = ["binance", "coinbase", "kraken", "okx"] as const

export const exchangeToName: Record<Exchange, string> = {
  binance: "Binance",
  coinbase: "Coinbase",
  kraken: "Kraken",
  okx: "OKX",
}
