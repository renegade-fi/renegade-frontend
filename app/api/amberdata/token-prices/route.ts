import { NextRequest } from "next/server"

import { fetchAssetPrice } from "@/app/api/amberdata/helpers"

import { DISPLAY_TOKENS, remapToken } from "@/lib/token"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const tokens = DISPLAY_TOKENS()
  try {
    const apiKey = process.env.AMBERDATA_API_KEY
    if (!apiKey) {
      throw new Error("AMBERDATA_API_KEY is not set")
    }

    const pricePromises = tokens.map((token) =>
      fetchAssetPrice(remapToken(token.ticker), apiKey),
    )
    const priceResults = await Promise.all(pricePromises)

    const priceData = tokens.map((token, index) => ({
      ticker: token.ticker,
      price: priceResults[index].payload.price,
    }))

    return new Response(JSON.stringify({ data: priceData }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error fetching token prices:", error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to fetch price data",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
