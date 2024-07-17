import { Token } from "@renegade-fi/react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { OrderbookResponseData } from "@/app/api/get-binance-orderbook/route"

import { Orderbook, TradeAmounts } from "./price-simulation"
import { Direction } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getBinanceOrderbook(
  base_ticker: string,
  quote_ticker: string,
  timestamp: number,
): Promise<OrderbookResponseData> {
  const url = new URL("/api/get-binance-orderbook", window.location.origin)
  url.searchParams.set("base_ticker", base_ticker)
  url.searchParams.set("quote_ticker", quote_ticker)
  url.searchParams.set("timestamp", timestamp.toString())
  const req = new Request(url)
  req.headers.set("Content-Type", "application/json")
  const res = await fetch(req)
  return res.json()
}

export async function simBinanceTradeAndMidpoint(
  base: Token,
  quote: Token,
  direction: Direction,
  quantity: number,
  timestamp: number,
): Promise<{ tradeAmounts: TradeAmounts; midpointPrice: number }> {
  // Fetch the Binance orderbook at the given timestamp
  const orderbookRes = await getBinanceOrderbook(
    base.ticker,
    quote.ticker,
    timestamp,
  )

  const orderbook = new Orderbook(orderbookRes.bids, orderbookRes.asks)

  // Simulate the effective amounts of base / quote that would be transacted on the Binance orderbook
  const tradeAmounts = orderbook.simulateTradeAmounts(quantity, direction)

  // Simulate the effective amounts of base / quote that would be transacted in Renegade (at the midpoint price)
  const midpointPrice = orderbook.midpointPrice()

  return {
    tradeAmounts,
    midpointPrice,
  }
}

export function calculateSavings(
  binanceTradeAmounts: TradeAmounts,
  quantity: number,
  direction: Direction,
  renegadePrice: number,
  renegadeFeeRate: number,
): number {
  const {
    effectiveBaseAmount: effectiveBinanceBase,
    effectiveQuoteAmount: effectiveBinanceQuote,
  } = binanceTradeAmounts

  const renegadeQuote = quantity * renegadePrice

  const effectiveRenegadeBase =
    direction === Direction.BUY ? quantity * (1 - renegadeFeeRate) : quantity

  const effectiveRenegadeQuote =
    direction === Direction.SELL
      ? renegadeQuote * (1 - renegadeFeeRate)
      : renegadeQuote

  // Calculate the savings in base/quote amounts transacted between the Binance and Renegade trades.
  // When buying, we save when we receive more base and send less quote than on Binance.
  // When selling, we save when we receive more quote and send less base than on Binance.
  const baseSavings =
    direction === Direction.BUY
      ? effectiveRenegadeBase - effectiveBinanceBase
      : effectiveBinanceBase - effectiveRenegadeBase

  const quoteSavings =
    direction === Direction.SELL
      ? effectiveRenegadeQuote - effectiveBinanceQuote
      : effectiveBinanceQuote - effectiveRenegadeQuote

  // Represent the total savings via Renegade, denominated in the quote asset, priced at the current midpoint
  return baseSavings * renegadePrice + quoteSavings
}
