import { DDogClient } from "@renegade-fi/internal-sdk"

export const runtime = "edge"

export async function GET() {
    const ddog = new DDogClient()
    try {
        const to = ddog.getTimestamp()
        const from = to - 365 * 24 * 60 * 60 // One year in seconds
        const res = await ddog.getTotalMatchVolume(from, to)
        if (res.status === 'ok') {
            if (res.series && res.series.length > 0) {
                return new Response(JSON.stringify({ data: res.series[0].pointlist }), { status: 200 })
            } else {
                return new Response(JSON.stringify({ error: 'No data found' }), { status: 500 })
            }
        }
        return new Response(JSON.stringify({ error: res.error }), { status: 500 })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error }), { status: 500 })
    }
}
