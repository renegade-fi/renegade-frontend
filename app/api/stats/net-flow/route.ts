import { NET_FLOW_KEY } from "@/app/api/stats/constants"

export interface NetFlowResponse {
  netFlow: number
  timestamp: number
}

export const runtime = "edge"

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.KV_REST_API_URL}/get/${NET_FLOW_KEY}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data) {
      return new Response(data.result, {
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
    console.error("Error fetching net flow data:", error)
    return new Response(
      JSON.stringify({ error: "Failed to retrieve net flow data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
