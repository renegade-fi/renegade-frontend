import { NextRequest, NextResponse } from "next/server"

import { mainnet } from "viem/chains"

import { getAlchemyRpcUrl } from "@/app/api/utils"

export const runtime = "edge"

const MAINNET_RPC_URL = getAlchemyRpcUrl(mainnet.id)

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.text()

    const response = await fetch(MAINNET_RPC_URL, {
      method: "POST",
      body: body,
    })

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal Server Error" },
      },
      { status: 500 },
    )
  }
}
