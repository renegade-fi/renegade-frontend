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
export const fundWallet = async (
  tokens: { ticker: string; amount: string }[],
  address: `0x${string}`,
) => {
  await fetch(`/api/faucet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tokens,
      address,
    }),
  })
}

export const fundList: { ticker: string; amount: string }[] = [
  { ticker: "WETH", amount: "3" },
  { ticker: "USDC", amount: "10000" },
  {
    ticker: "WBTC",
    amount: "0.2",
  },
  {
    ticker: "BNB",
    amount: "17",
  },
  {
    ticker: "MATIC",
    amount: "10000",
  },
  {
    ticker: "LDO",
    amount: "5000",
  },
  {
    ticker: "LINK",
    amount: "700",
  },
  {
    ticker: "UNI",
    amount: "1250",
  },
  {
    ticker: "SUSHI",
    amount: "5000",
  },
  {
    ticker: "1INCH",
    amount: "10000",
  },
  {
    ticker: "AAVE",
    amount: "120",
  },
  {
    ticker: "COMP",
    amount: "180",
  },
  {
    ticker: "MKR",
    amount: "3.75",
  },
  {
    ticker: "MANA",
    amount: "10000",
  },
  {
    ticker: "ENS",
    amount: "700",
  },
  {
    ticker: "DYDX",
    amount: "3333",
  },
  {
    ticker: "CRV",
    amount: "10000",
  },
]
