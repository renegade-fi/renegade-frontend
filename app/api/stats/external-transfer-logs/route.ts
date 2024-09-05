import {
  BucketData,
  ExternalTransferData,
  INFLOWS_KEY,
  INFLOWS_SET_KEY,
} from "@/app/api/stats/constants"
import { getAllSetMembers } from "@/app/lib/kv-utils"
import { kv } from "@vercel/kv"
import { NextRequest } from "next/server"
export const runtime = "edge"
export const dynamic = "force-dynamic"

function startOfPeriod(timestamp: number, intervalMs: number): number {
  return Math.floor(timestamp / intervalMs) * intervalMs
}

export async function GET(req: NextRequest) {
  try {
    const intervalMs = parseInt(req.nextUrl.searchParams.get("interval") || "86400000")

    const transactionHashes = await getAllSetMembers(kv, INFLOWS_SET_KEY);

    // Use pipelining to fetch all data in a single round-trip
    const pipeline = kv.pipeline();
    transactionHashes.forEach(hash => pipeline.get(`${INFLOWS_KEY}:${hash}`));
    const data = await pipeline.exec();

    const buckets: Record<string, BucketData> = {};

    data.forEach((item) => {
      if (item && typeof item === "object" && "timestamp" in item) {
        const transfer = item as ExternalTransferData;
        const bucketTimestamp = startOfPeriod(transfer.timestamp, intervalMs);
        const bucketKey = bucketTimestamp.toString();

        if (!buckets[bucketKey]) {
          buckets[bucketKey] = {
            timestamp: bucketKey,
            depositAmount: 0,
            withdrawalAmount: 0,
          };
        }

        if (transfer.isWithdrawal) {
          buckets[bucketKey].withdrawalAmount += transfer.amount;
        } else {
          buckets[bucketKey].depositAmount += transfer.amount;
        }
      }
    });

    const sortedBucketData = Object.values(buckets).sort(
      (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp)
    );

    return new Response(JSON.stringify({ data: sortedBucketData, intervalMs }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch external transfer logs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export type ExternalTransferLogsResponse = {
  data: BucketData[]
  intervalMs: number
}
