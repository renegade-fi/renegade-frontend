import { NextRequest, NextResponse } from "next/server"

import { env } from "@/env/server"

export const runtime = "edge"

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.text()

    const response = await fetch(env.RPC_URL_SOLANA, {
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
        error,
      },
      { status: 500 },
    )
  }
}
