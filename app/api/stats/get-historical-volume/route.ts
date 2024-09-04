import { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { HISTORICAL_VOLUME_SET_KEY } from "@/app/api/stats/constants"


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

export async function GET(req: NextRequest) {
    console.log("Fetching all historical volume data")
    try {
        // Get all keys from the set
        const allKeys = await kv.smembers(HISTORICAL_VOLUME_SET_KEY)
        console.log(`Total keys in set: ${allKeys.length}`)

        // Fetch data for all keys
        const dataPromises = allKeys.map(async (key) => {
            const data = await kv.get(key)
            console.log("🚀 ~ dataPromises ~ data:", data)
            return data as VolumeDataPoint
        })

        const volumeData = await Promise.all(dataPromises)
        console.log("🚀 ~ GET ~ volumeData:", volumeData)

        // Sort data by timestamp
        volumeData.sort((a, b) => a.timestamp - b.timestamp)

        const response: HistoricalVolumeResponse = {
            data: volumeData,
            startTimestamp: volumeData[0]?.timestamp || 0,
            endTimestamp: volumeData[volumeData.length - 1]?.timestamp || 0,
            totalPoints: volumeData.length,
        }

        console.log(`Returning ${response.totalPoints} data points`)
        return new Response(JSON.stringify(response), {
            headers: { "Content-Type": "application/json" },
        })
    } catch (error) {
        console.error("Error fetching historical volume data:", error)
        return new Response(JSON.stringify({ error: "Failed to fetch historical volume data" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        })
    }
}