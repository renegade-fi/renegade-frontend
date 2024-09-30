import { NextRequest } from "next/server"

import { kv } from "@vercel/kv"

import { HISTORICAL_VOLUME_SET_KEY } from "@/app/api/stats/constants"
import { getAllSetMembers } from "@/app/lib/kv-utils"

export interface VolumeDataPoint {
  timestamp: number
  volume: number
}

export interface HistoricalVolumeResponse {
  data: VolumeDataPoint[]
  startTimestamp: number
  endTimestamp: number
  totalPoints: number
}

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const allKeys = await getAllSetMembers(kv, HISTORICAL_VOLUME_SET_KEY)

    const pipelineBody = JSON.stringify(allKeys.map((key) => ["GET", key]))

    // Fetch all values for the keys using a single pipeline request
    const pipelineResponse = await fetch(
      `${process.env.KV_REST_API_URL}/pipeline`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
        body: pipelineBody,
        cache: "no-store",
      },
    )

    if (!pipelineResponse.ok) {
      throw new Error(`HTTP error! status: ${pipelineResponse.status}`)
    }

    const pipelineResults = await pipelineResponse.json()

    // Process the pipeline results
    const data: VolumeDataPoint[] = pipelineResults
      .map(({ result }: { result: string | null }, index: number) => {
        if (result === null) {
          console.warn(`No data found for key: ${allKeys[index]}`)
          return null
        }
        try {
          return JSON.parse(result) as VolumeDataPoint
        } catch (error) {
          console.error(
            `Error parsing result for key ${allKeys[index]}:`,
            error,
          )
          return null
        }
      })
      .filter(
        (item: VolumeDataPoint | null): item is VolumeDataPoint =>
          item !== null,
      )

    const volumeData: VolumeDataPoint[] = []
    let startTimestamp = Infinity
    let endTimestamp = -Infinity

    data.forEach((item) => {
      if (
        item &&
        typeof item === "object" &&
        "timestamp" in item &&
        "volume" in item
      ) {
        const dataPoint = item as VolumeDataPoint
        volumeData.push(dataPoint)
        startTimestamp = Math.min(startTimestamp, dataPoint.timestamp)
        endTimestamp = Math.max(endTimestamp, dataPoint.timestamp)
      }
    })

    volumeData.sort((a, b) => a.timestamp - b.timestamp)

    const response: HistoricalVolumeResponse = {
      data: volumeData,
      startTimestamp: startTimestamp !== Infinity ? startTimestamp : 0,
      endTimestamp: endTimestamp !== -Infinity ? endTimestamp : 0,
      totalPoints: volumeData.length,
    }

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch historical volume data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
