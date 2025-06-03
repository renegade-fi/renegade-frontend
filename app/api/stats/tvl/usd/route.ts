// Returns TVL in USD
import { encodeFunctionData, formatUnits, hexToBigInt, parseAbi } from "viem"
import { arbitrum } from "viem/chains"

import { fetchAssetPrice } from "@/app/api/amberdata/helpers"
import { getAlchemyRpcUrl } from "@/app/api/utils"

import { env } from "@/env/server"
import { DISPLAY_TOKENS, remapToken } from "@/lib/token"
import { arbitrumSDKConfig } from "@/lib/viem"

export const runtime = "edge"

export async function GET() {
  try {
    const tokens = DISPLAY_TOKENS()

    // Fetch balance and price for each token in parallel with error handling
    const tokenData = await Promise.all(
      tokens.map(async (token) => {
        try {
          const [balance, price] = await Promise.all([
            fetchTvl(
              token.address,
              getAlchemyRpcUrl(arbitrum.id),
              arbitrumSDKConfig.darkpoolAddress,
            ),
            fetchAssetPrice(remapToken(token.address), env.AMBERDATA_API_KEY),
          ])
          return {
            balance,
            price: price.payload.price,
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
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
])

// Bypassing viem readContract because it returns inconsistent data, maybe due to caching
async function fetchTvl(
  tokenAddress: `0x${string}`,
  rpcUrl: string,
  darkpoolContract: `0x${string}`,
): Promise<bigint> {
  const data = encodeFunctionData({
    abi,
    functionName: "balanceOf",
    args: [darkpoolContract],
  })

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`)
  }

  return hexToBigInt(result.result)
}
