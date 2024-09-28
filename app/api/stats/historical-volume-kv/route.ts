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

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const allKeys = await getAllSetMembers(kv, HISTORICAL_VOLUME_SET_KEY)

    // Use pipelining to fetch all data in a single round-trip
    const pipeline = kv.pipeline()
    allKeys.forEach((key) => pipeline.get(key))
    const data = await pipeline.exec()

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
