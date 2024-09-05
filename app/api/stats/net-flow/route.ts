import { NextRequest } from "next/server"

import { kv } from "@vercel/kv"

import { NET_FLOW_KEY } from "@/app/api/stats/constants"

export interface NetFlowResponse {
  netFlow: number
  timestamp: number
}

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const data = await kv.get<NetFlowResponse>(NET_FLOW_KEY)
    if (data) {
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({ error: "Net flow data not available" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to retrieve net flow data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
