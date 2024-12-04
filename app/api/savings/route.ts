import invariant from "tiny-invariant"

import {
  calculateSavings,
  constructBinanceOrderbook,
} from "@/app/api/savings/helpers"

import { Orderbook } from "@/lib/price-simulation"
import { remapToken } from "@/lib/token"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const res = await request.json()
    const {
      baseTicker,
      quoteTicker,
      direction,
      amount,
      renegadeFeeRate,
      timestamp = Date.now(),
    } = res
    invariant(baseTicker, "baseTicker is required")
    invariant(quoteTicker, "quoteTicker is required")
    invariant(direction, "direction is required")
    invariant(renegadeFeeRate, "renegadeFeeRate is required")

    if (!amount) {
      return Response.json({ savings: 0 })
    }

    const instrument = `${remapToken(baseTicker)}_usdt`

    const orderbookRes = await constructBinanceOrderbook(instrument, timestamp)

    const orderbook = new Orderbook(orderbookRes.bids, orderbookRes.asks)

    // Simulate the effective amounts of base / quote that would be transacted on the Binance orderbook
    const tradeAmounts = orderbook.simulateTradeAmounts(amount, direction)

    // Simulate the effective amounts of base / quote that would be transacted in Renegade (at the midpoint price)
    const midpointPrice = orderbook.midpointPrice()

    const savings = calculateSavings(
      tradeAmounts,
      amount,
      direction,
      midpointPrice,
      renegadeFeeRate,
    )

    return Response.json({ savings })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ savings: 0, error }), { status: 500 })
  }
}
