import invariant from "tiny-invariant"

import { env } from "@/env/server"

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
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

    const url = new URL(`${env.BOT_SERVER_URL}/${TIME_TO_FILL_PATH}`)
    url.searchParams.set("amount", amount)
    url.searchParams.set("baseTicker", baseTicker)

    const res = await fetch(url, {
      headers: { "x-api-key": env.BOT_SERVER_API_KEY },
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
