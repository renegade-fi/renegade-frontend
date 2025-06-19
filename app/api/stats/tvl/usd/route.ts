// Returns TVL in USD
import { NextRequest } from "next/server"

import { getSDKConfig } from "@renegade-fi/react"
import { formatUnits } from "viem"

import { fetchTvl, getAlchemyRpcUrl } from "@/app/api/utils"

import { client } from "@/lib/clients/price-reporter"
import { DISPLAY_TOKENS } from "@/lib/token"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const chainIdParam = req.nextUrl.searchParams.get("chainId")
    const chainId = Number(chainIdParam)

    const rpcUrl = getAlchemyRpcUrl(chainId)
    const sdkConfig = getSDKConfig(chainId)
    const tokens = DISPLAY_TOKENS({ chainId })

    // Fetch balance and price for each token in parallel with error handling
    const tokenData = await Promise.all(
      tokens.map(async (token) => {
        try {
          const [balance, price] = await Promise.all([
            fetchTvl(token.address, rpcUrl, sdkConfig.darkpoolAddress),
            client.getPrice(token.address),
          ])
          return {
            balance,
            price,
            decimals: token.decimals,
          }
        } catch (error) {
          console.error(`Error fetching data for ${token.ticker}:`, error)
          return { balance: BigInt(0), price: 0, decimals: token.decimals }
        }
      }),
    )

    // Calculate total TVL from the combined token data
    const tvl = tokenData.reduce((total, { balance, price, decimals }) => {
      const decimalCorrectedTvl = formatUnits(balance, decimals)
      return total + Number(decimalCorrectedTvl) * Number(price)
    }, 0)

    return new Response(JSON.stringify({ tvl }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in GET:", error)
    return new Response(
      JSON.stringify({
        error: `Invalid or unsupported chain ID: ${req.nextUrl.searchParams.get("chainId")}`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
