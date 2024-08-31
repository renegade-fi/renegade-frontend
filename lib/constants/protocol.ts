// Constants

// Min fill size of the quote asset that the relayer will accept
export const MIN_FILL_SIZE = BigInt(1000000000000000000)
// TODO: [CORRECTNESS] Should fetch from relayer
// Relayer fee
export const RELAYER_FEE = 0.0008
// Protocol fee
export const PROTOCOL_FEE = 0.0002
// Default mint
export const DEFAULT_MINT = "0x0000000000000000000000000000000000000000"
// Renegade protocol fee
export const RENEGADE_PROTOCOL_FEE_RATE = 0.0002
// Renegade relayer fee
export const RENEGADE_RELAYER_FEE_RATE = 0.0008
// Binance base fee
export const BINANCE_BASE_FEE = 0.001

// Types

// Side
export enum Side {
  BUY = "buy",
  SELL = "sell",
}

export const EXCHANGES = ["binance", "coinbase", "kraken", "okx"] as const
