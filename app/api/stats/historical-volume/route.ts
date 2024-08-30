import { DDogClient } from "@renegade-fi/internal-sdk"

export const runtime = "edge"

export async function GET(request: Request) {
  const ddog = new DDogClient()
  try {
    const { searchParams } = new URL(request.url)
    const to = parseInt(searchParams.get("to") || "")
    const from = parseInt(searchParams.get("from") || "")
    const interval = parseInt(searchParams.get("interval") || "") // Default to 1 day if not provided

    if (isNaN(to) || isNaN(from) || isNaN(interval)) {
      return new Response(
        JSON.stringify({ error: "Invalid to or from parameter" }),
        { status: 400 },
      )
    }

    const res = await ddog.getMatchVolumePerInterval(from, to, interval)
    if (res.status === "ok") {
      if (res.series && res.series.length > 0) {
        return new Response(JSON.stringify({ data: res.series[0].pointlist }), {
          status: 200,
        })
      } else {
        return new Response(JSON.stringify({ error: "No data found" }), {
          status: 500,
        })
      }
    }
    return new Response(JSON.stringify({ error: res.error }), { status: 500 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
