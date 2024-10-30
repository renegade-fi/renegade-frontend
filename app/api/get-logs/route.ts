import { NextRequest } from "next/server"

import { encodeEventTopics, numberToHex, parseAbiItem, toHex } from "viem"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const blinderShare = BigInt(
      req.nextUrl.searchParams.get("blinderShare") || "0",
    )
    if (!blinderShare) {
      throw new Error("Blinder share is required")
    }

    const topics = encodeEventTopics({
      abi: [
        parseAbiItem(
          "event WalletUpdated(uint256 indexed wallet_blinder_share)",
        ),
      ],
      args: {
        wallet_blinder_share: blinderShare,
      },
    })

    // Make raw JSON-RPC call
    const response = await fetch(process.env.RPC_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getLogs",
        params: [
          {
            address: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
            topics,
            fromBlock: toHex(process.env.FROM_BLOCK ?? 0),
          },
        ],
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch logs because ${response.statusText}`)
    }

    const result = await response.json()
    if (result.error) {
      throw new Error(`RPC error: ${result.error.message}`)
    }

    return new Response(JSON.stringify({ logs: result.result.length }))
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
