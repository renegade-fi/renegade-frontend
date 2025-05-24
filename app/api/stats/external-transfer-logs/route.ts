import { NextRequest } from "next/server"

import {
  BucketData,
  ExternalTransferData,
  INFLOWS_KEY,
  INFLOWS_SET_KEY,
} from "@/app/api/stats/constants"
import { getAllSetMembers } from "@/app/lib/kv-utils"

import { env } from "@/env/server"

export const runtime = "edge"

function startOfPeriod(timestamp: number, intervalMs: number): number {
  return Math.floor(timestamp / intervalMs) * intervalMs
}

export async function GET(req: NextRequest) {
  try {
    const intervalMs = parseInt(
      req.nextUrl.searchParams.get("interval") || "86400000",
    )

    const transactionHashes = await getAllSetMembers(INFLOWS_SET_KEY)

    // Use fetch pipeline to get all data in a single round-trip
    const pipelineBody = JSON.stringify(
      transactionHashes.map((hash) => ["GET", `${INFLOWS_KEY}:${hash}`]),
    )

    const pipelineResponse = await fetch(`${env.KV_REST_API_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
      },
      body: pipelineBody,
    })

    if (!pipelineResponse.ok) {
      throw new Error(`HTTP error! status: ${pipelineResponse.status}`)
    }

    const pipelineResults = await pipelineResponse.json()

    const buckets: Record<string, BucketData> = {}

    pipelineResults.forEach(({ result }: { result: string | null }) => {
      if (result === null) return

      try {
        const transfer = JSON.parse(result) as ExternalTransferData
        const bucketTimestamp = startOfPeriod(transfer.timestamp, intervalMs)
        const bucketKey = bucketTimestamp.toString()

        if (!buckets[bucketKey]) {
          buckets[bucketKey] = {
            timestamp: bucketKey,
            depositAmount: 0,
            withdrawalAmount: 0,
          }
        }

        if (transfer.isWithdrawal) {
          buckets[bucketKey].withdrawalAmount += transfer.amount
        } else {
          buckets[bucketKey].depositAmount += transfer.amount
        }
      } catch (error) {
        console.error("Error parsing result:", error)
      }
    })

    const sortedBucketData = Object.values(buckets).sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
    )

    return new Response(
      JSON.stringify({ data: sortedBucketData, intervalMs }),
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch external transfer logs" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export type ExternalTransferLogsResponse = {
  data: BucketData[]
  intervalMs: number
}
