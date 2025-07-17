import type { NextRequest } from "next/server";

import { getNetFlowKey } from "@/app/api/stats/constants";

import { env } from "@/env/server";

export interface NetFlowResponse {
    netFlow: number;
    timestamp: number;
}

export const runtime = "edge";

export async function GET(req: NextRequest) {
    // Parse and validate chainId
    const chainIdParam = req.nextUrl.searchParams.get("chainId");
    const chainId = Number(chainIdParam);
    if (Number.isNaN(chainId)) {
        return new Response(JSON.stringify({ error: `Invalid chainId: ${chainIdParam}` }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
    const netFlowKey = getNetFlowKey(chainId);

    try {
        const response = await fetch(`${env.KV_REST_API_URL}/get/${netFlowKey}`, {
            headers: {
                Authorization: `Bearer ${env.KV_REST_API_TOKEN}`,
            },
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && typeof data.result === "string") {
            return new Response(data.result, {
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Net flow data not available" }), {
            headers: { "Content-Type": "application/json" },
            status: 404,
        });
    } catch (error) {
        console.error("Error fetching net flow data:", error);
        return new Response(JSON.stringify({ error: "Failed to retrieve net flow data" }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        });
    }
}
