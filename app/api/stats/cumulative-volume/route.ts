import { DDogClient } from "@renegade-fi/internal-sdk"

export const runtime = "edge"

export async function GET(request: Request) {
  const ddog = new DDogClient(
    process.env.DD_API_KEY,
    process.env.DD_APP_KEY,
    process.env.DD_ENV,
    process.env.DD_SERVICE,
  )
  try {
    const { searchParams } = new URL(request.url)
    const to = parseInt(searchParams.get("to") || "")
    const from = parseInt(searchParams.get("from") || "")

    if (isNaN(to) || isNaN(from)) {
      return new Response(
        JSON.stringify({ error: "Invalid to or from parameter" }),
        { status: 400 },
      )
    }

    const res = await ddog.getCumulativeMatchVolume(from, to)
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
