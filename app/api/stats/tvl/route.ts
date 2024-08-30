import { encodeFunctionData, hexToBigInt, parseAbi } from "viem"

import { DISPLAY_TOKENS } from "@/lib/token"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const tokens = DISPLAY_TOKENS()
    const rpcUrl = process.env.RPC_URL
    const darkpoolContract = process.env
      .NEXT_PUBLIC_DARKPOOL_CONTRACT as `0x${string}`

    if (!rpcUrl) {
      throw new Error("RPC_URL is not set")
    }
    if (!darkpoolContract) {
      throw new Error("NEXT_PUBLIC_DARKPOOL_CONTRACT is not set")
    }

    const tvlData = await Promise.all(
      tokens.map(async (token) => {
        try {
          const tvl = await fetchTvl(token.address, rpcUrl, darkpoolContract)
          return { ticker: token.ticker, tvl: tvl.toString() }
        } catch (error) {
          console.error(`Error fetching TVL for ${token.ticker}:`, error)
          return { ticker: token.ticker, tvl: "0" }
        }
      }),
    )

    return new Response(JSON.stringify({ data: tvlData }), {
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
    cache: "no-store",
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
