import { NextRequest } from "next/server"

import { getSDKConfig } from "@renegade-fi/react"
import { encodeEventTopics, parseAbiItem, toHex } from "viem"
import { arbitrum } from "viem/chains"

import { getAlchemyRpcUrl } from "@/app/api/utils"

import { getDeployBlock } from "@/lib/viem"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const blinderShare = BigInt(
      req.nextUrl.searchParams.get("blinderShare") || "0",
    )
    if (!blinderShare) {
      throw new Error("Blinder share is required")
    }
    const chainId = Number(req.nextUrl.searchParams.get("chainId"))
    if (!chainId) {
      throw new Error("Chain ID is required")
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
    const deployBlock = getDeployBlock(chainId) ?? BigInt(0)

    // Make raw JSON-RPC call
    const response = await fetch(getAlchemyRpcUrl(arbitrum.id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getLogs",
        params: [
          {
            address: getSDKConfig(chainId).darkpoolAddress,
            topics,
            fromBlock: toHex(deployBlock),
          },
        ],
      }),
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
