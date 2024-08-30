import { fetchAssetPrice } from "@/app/api/amberdata/helpers"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_AMBERDATA_API_KEY
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_AMBERDATA_API_KEY is not set")
    }

    const { searchParams } = new URL(request.url)
    const asset = searchParams.get("asset")

    if (!asset) {
      throw new Error("Asset parameter is required")
    }

    const data = await fetchAssetPrice(asset, apiKey)
    return Response.json(data)
  } catch (error) {
    console.error("Error fetching Amberdata price:", error)
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to fetch price data",
      }),
      { status: 400 },
    )
  }
}
