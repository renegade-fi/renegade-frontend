import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const AMBERDATA_BASE_URL = "https://api.amberdata.com"
const API_KEY_HEADER = "x-api-key"

export async function GET(request: NextRequest) {
  try {
    // Get the path and search params from the request
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 },
      )
    }

    const amberdataUrl = new URL(`${AMBERDATA_BASE_URL}${path}`)

    // Copy all other search params to the new URL
    searchParams.forEach((value, key) => {
      if (key !== "path") {
        amberdataUrl.searchParams.append(key, value)
      }
    })
    const response = await fetch(amberdataUrl, {
      headers: {
        [API_KEY_HEADER]: process.env.AMBERDATA_API_KEY as string,
        "Accept-Encoding": "gzip",
      },
    })

    if (!response.ok) {
      throw new Error(`Amberdata API responded with status: ${response.status}`)
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
        "Content-Encoding": response.headers.get("Content-Encoding") || "",
      },
    })
  } catch (error) {
    console.error("Error in Amberdata proxy:", error)

    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 },
    )
  }
}
