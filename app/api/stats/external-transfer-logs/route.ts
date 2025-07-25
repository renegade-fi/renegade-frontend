import type { NextRequest } from "next/server";

import {
    type BucketData,
    type ExternalTransferData,
    getInflowsKey,
    getInflowsSetKey,
} from "@/app/api/stats/constants";
import { getAllSetMembers } from "@/app/lib/kv-utils";

import { env } from "@/env/server";

export const runtime = "edge";

function startOfPeriod(timestamp: number, intervalMs: number): number {
    return Math.floor(timestamp / intervalMs) * intervalMs;
}

export async function GET(req: NextRequest) {
    // Parse and validate chainId
    const chainIdParam = req.nextUrl.searchParams.get("chainId");
    const chainId = Number(chainIdParam);
    if (Number.isNaN(chainId)) {
        return new Response(JSON.stringify({ error: `Invalid chainId: ${chainIdParam}` }), {
            status: 400,
        });
    }
    const inflowsKey = getInflowsKey(chainId);
    const inflowsSetKey = getInflowsSetKey(chainId);
    try {
        const intervalMs = parseInt(req.nextUrl.searchParams.get("interval") || "86400000");

        const transactionHashes = await getAllSetMembers(inflowsSetKey);

        // Use fetch pipeline to get all data in a single round-trip
        const pipelineBody = JSON.stringify(
            transactionHashes.map((hash) => ["GET", `${inflowsKey}:${hash}`]),
        );

        const pipelineResponse = await fetch(`${env.KV_REST_API_URL}/pipeline`, {
            body: pipelineBody,
            headers: {
                Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
            },
            method: "POST",
        });

        if (!pipelineResponse.ok) {
            throw new Error(`HTTP error! status: ${pipelineResponse.status}`);
        }

        const pipelineResults = await pipelineResponse.json();

        const buckets: Record<string, BucketData> = {};

        pipelineResults.forEach(({ result }: { result: string | null }) => {
            if (result === null) return;

            try {
                const transfer = JSON.parse(result) as ExternalTransferData;
                const bucketTimestamp = startOfPeriod(transfer.timestamp, intervalMs);
                const bucketKey = bucketTimestamp.toString();

                if (!buckets[bucketKey]) {
                    buckets[bucketKey] = {
                        depositAmount: 0,
                        timestamp: bucketKey,
                        withdrawalAmount: 0,
                    };
                }

                if (transfer.isWithdrawal) {
                    buckets[bucketKey].withdrawalAmount += transfer.amount;
                } else {
                    buckets[bucketKey].depositAmount += transfer.amount;
                }
            } catch (error) {
                console.error("Error parsing result:", error);
            }
        });

        const sortedBucketData = Object.values(buckets).sort(
            (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
        );

        return new Response(JSON.stringify({ data: sortedBucketData, intervalMs }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (_error) {
        return new Response(JSON.stringify({ error: "Failed to fetch external transfer logs" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
}

export type ExternalTransferLogsResponse = {
    data: BucketData[];
    intervalMs: number;
};
