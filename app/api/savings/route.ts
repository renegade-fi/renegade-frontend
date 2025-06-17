import invariant from "tiny-invariant"

import {
  calculateSavings,
  constructOrderbook,
  getExchangeFeeRate,
} from "@/app/api/savings/helpers"

import { exchangeToAmberdataExchange, getPriceChartInfo } from "@/lib/amberdata"
import { client } from "@/lib/clients/price-reporter"
import { Orderbook } from "@/lib/price-simulation"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const res = await request.json()
    const {
      baseMint,
      quoteTicker,
      direction,
      amount,
      renegadeFeeRate,
      timestamp = Date.now(),
      isQuoteCurrency,
    } = res
    invariant(baseMint, "baseMint is required")
    invariant(quoteTicker, "quoteTicker is required")
    invariant(direction, "direction is required")
    invariant(renegadeFeeRate, "renegadeFeeRate is required")

    if (!amount) {
      return Response.json({ savings: 0 })
    }

    // Amount in base units
    let normalizedAmount = amount

    // If in quote units, convert to base units by dividing by the quote price
    if (isQuoteCurrency) {
      const price = await client.getPrice(baseMint)
      normalizedAmount = amount / price
    }

    const info = getPriceChartInfo(baseMint)
    const instrument = info.instrument
    const exchange = info.exchange
    const amberdataExchange = exchangeToAmberdataExchange(exchange)

    const orderbookRes = await constructOrderbook(
      instrument,
      timestamp,
      amberdataExchange,
    )

    const feeRate = getExchangeFeeRate(exchange)
    const orderbook = new Orderbook(
      orderbookRes.bids,
      orderbookRes.asks,
      feeRate,
    )

    // Simulate the effective amounts of base / quote that would be transacted on the orderbook
    const tradeAmounts = orderbook.simulateTradeAmounts(
      normalizedAmount,
      direction,
    )

    // Simulate the effective amounts of base / quote that would be transacted in Renegade (at the midpoint price)
    const midpointPrice = orderbook.midpointPrice()

    const savings = calculateSavings(
      tradeAmounts,
      normalizedAmount,
      direction,
      midpointPrice,
      renegadeFeeRate,
    )

    // Calculate total trade value in quote currency
    const totalTradeValue = normalizedAmount * midpointPrice

    // Calculate savings in basis points (bps)
    const savingsBps =
      totalTradeValue > 0 ? (savings / totalTradeValue) * 10000 : 0

    return Response.json({ savings, savingsBps })
  } catch (error) {
    console.error("🚀 ~ POST ~ error:", error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
