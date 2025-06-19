import { NextRequest, NextResponse } from "next/server"

import { getAlchemyRpcUrl } from "@/app/api/utils"

export const runtime = "edge"

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const params = req.nextUrl.searchParams
    const chainId = params.get("id")
    if (!chainId || Number.isNaN(Number(chainId))) {
      return NextResponse.json(
        {
          error: { code: -32602, message: "Invalid chainId" },
        },
        { status: 400 },
      )
    }
    const RPC_URL = getAlchemyRpcUrl(Number(chainId))
    const body = await req.text()

    const response = await fetch(RPC_URL, {
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
