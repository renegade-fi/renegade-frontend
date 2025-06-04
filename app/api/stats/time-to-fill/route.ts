import { NextRequest } from "next/server"

import { getBotServerApiKey, getBotServerUrl } from "../../utils"

export const runtime = "edge"

const TIME_TO_FILL_PATH = "time-to-fill"

export type TimeToFillResponse = {
  data?: {
    estimatedMs: number
  }
  error?: string
}

interface BotServerResponse {
  data: number // milliseconds
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const amount = searchParams.get("amount")
    const baseTicker = searchParams.get("baseTicker")

    if (!amount || !baseTicker) {
      return Response.json(
        {
          error: "Invalid amount or baseTicker parameter",
        } satisfies TimeToFillResponse,
        { status: 400 },
      )
    }

    const chainIdParam = req.nextUrl.searchParams.get("chainId")
    const chainId = Number(chainIdParam)
    if (isNaN(chainId)) {
      return new Response(
        JSON.stringify({ error: `Invalid chainId: ${chainIdParam}` }),
        { status: 400 },
      )
    }

    const botServerUrl = getBotServerUrl(chainId)
    const botServerApiKey = getBotServerApiKey(chainId)

    const url = new URL(`${botServerUrl}/${TIME_TO_FILL_PATH}`)
    url.searchParams.set("amount", amount)
    url.searchParams.set("baseTicker", baseTicker)

    const res = await fetch(url, {
      headers: { "x-api-key": botServerApiKey },
    })

    if (!res.ok) {
      throw new Error(
        `Bot server responded with status ${res.status}: ${res.statusText}`,
      )
    }

    const data = (await res.json()) as BotServerResponse

    return Response.json(
      { data: { estimatedMs: data.data } } satisfies TimeToFillResponse,
      { status: 200 },
    )
  } catch (error) {
    console.error("[TimeToFill API] Error:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      error,
    })

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch time to fill",
      } satisfies TimeToFillResponse,
      { status: 500 },
    )
  }
}
