import { NextRequest } from "next/server"

import { DDogClient } from "@renegade-fi/internal-sdk"
import { kv } from "@vercel/kv"

import {
  HISTORICAL_VOLUME_KEY_PREFIX,
  HISTORICAL_VOLUME_SET_KEY,
} from "@/app/api/stats/constants"

export const maxDuration = 300
export const dynamic = "force-dynamic"

interface VolumeData {
  timestamp: number
  volume: number
}

export async function GET(req: NextRequest) {
  console.log("Starting cron job: set-volume-kv")
  try {
    const ddog = new DDogClient()
    const { searchParams } = new URL(req.url)
    const to = parseInt(searchParams.get("to") || Date.now().toString())
    const from = parseInt(searchParams.get("from") || "1693958400")
    const interval = parseInt(
      searchParams.get("interval") || (24 * 60 * 60).toString(),
    ) // Default to 1 day if not provided

    console.log(`Parameters: to=${to}, from=${from}, interval=${interval}`)

    if (isNaN(to) || isNaN(from) || isNaN(interval)) {
      console.error("Invalid parameters detected")
      return new Response(
        JSON.stringify({ error: "Invalid to, from, or interval parameter" }),
        { status: 400 },
      )
    }

    console.log(
      `Fetching match volume from ${from} to ${to} with interval ${interval}`,
    )
    const res = await ddog.getMatchVolumePerInterval(from, to, interval)
    console.log(`DDogClient response status: ${res.status}`)

    if (
      res.status === "ok" &&
      res.series &&
      res.series.length > 0 &&
      res.series[0].pointlist
    ) {
      console.log(
        `Raw data points: ${JSON.stringify(res.series[0].pointlist.slice(0, 5))}...`,
      ) // Log first 5 data points

      const volumeData = res.series[0].pointlist.map(([timestamp, volume]) => ({
        timestamp: Math.floor(timestamp / 1000), // Convert to seconds
        volume,
      }))

      console.log(`Processing ${volumeData.length} volume data points`)
      console.log(
        `Sample processed data: ${JSON.stringify(volumeData.slice(0, 5))}...`,
      ) // Log first 5 processed data points

      let successCount = 0
      const setPromises = volumeData.map(async (data: VolumeData, index) => {
        const key = `${HISTORICAL_VOLUME_KEY_PREFIX}:${data.timestamp}`
        try {
          await kv.set(key, JSON.stringify(data))
          await kv.sadd(HISTORICAL_VOLUME_SET_KEY, key)
          successCount++
          if (index % 10 === 0)
            console.log(
              `Processed ${index + 1}/${volumeData.length} data points`,
            )
        } catch (error) {
          console.error(`Error processing data point ${index}:`, error)
        }
      })

      await Promise.all(setPromises)

      console.log(
        `Volume data successfully written to KV store. ${successCount}/${volumeData.length} points processed successfully`,
      )
      return new Response(
        JSON.stringify({
          message: `Processed ${successCount}/${volumeData.length} volume data points`,
          firstTimestamp: volumeData[0]?.timestamp,
          lastTimestamp: volumeData[volumeData.length - 1]?.timestamp,
        }),
      )
    } else {
      console.error("Error fetching volume data:", res.error)
      console.log("Full response:", JSON.stringify(res))
      return new Response(
        JSON.stringify({ error: res.error || "No data found" }),
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in cron job:", error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    })
  }
}
