import { NextRequest } from "next/server"

import { kv } from "@vercel/kv"

import {
  BucketData,
  ExternalTransferData,
  INFLOWS_KEY,
  INFLOWS_SET_KEY,
} from "@/app/api/stats/constants"

export const dynamic = "force-dynamic"

function startOfPeriod(timestamp: number, intervalMs: number): number {
  return Math.floor(timestamp / intervalMs) * intervalMs
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const intervalMs = parseInt(searchParams.get("interval") || "86400000") // Default to 1 day

    // Fetch all transaction hashes from the Set
    const transactionHashes = await kv.smembers(INFLOWS_SET_KEY)

    // Fetch all values for the transaction hashes
    const dataPromises = transactionHashes.map((hash) =>
      kv.get(`${INFLOWS_KEY}:${hash}`),
    )
    const data = await Promise.all(dataPromises)

    // Filter out any null values and ensure the type is ExternalTransferData
    const validData: ExternalTransferData[] = data.filter(
      (item): item is ExternalTransferData =>
        item !== null && typeof item === "object" && "timestamp" in item,
    )

    // Sort validData in chronological order
    validData.sort((a, b) => a.timestamp - b.timestamp)

    // Bucket data into specified intervals
    const buckets = validData.reduce(
      (acc, item) => {
        const bucketTimestamp = startOfPeriod(item.timestamp, intervalMs)
        if (!acc[bucketTimestamp]) {
          acc[bucketTimestamp] = {
            timestamp: bucketTimestamp.toString(),
            depositAmount: 0,
            withdrawalAmount: 0,
            transactions: [],
          }
        }
        if (item.isWithdrawal) {
          acc[bucketTimestamp].withdrawalAmount += item.amount
        } else {
          acc[bucketTimestamp].depositAmount += item.amount
        }
        acc[bucketTimestamp].transactions.push(item)
        return acc
      },
      {} as Record<string, BucketData>,
    )

    // Convert to array and sort by timestamp (oldest first)
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
    console.error(error)
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
