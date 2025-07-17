import { DDogClient } from "@renegade-fi/internal-sdk";
import { CHAIN_SPECIFIERS } from "@renegade-fi/react/constants";
import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";

import { getHistoricalVolumeKeyPrefix, getHistoricalVolumeSetKey } from "@/app/api/stats/constants";

import { env } from "@/env/server";

interface VolumeData {
    timestamp: number;
    volume: number;
}

interface SearchParams {
    to: number;
    from: number;
    interval: number;
}

const DEFAULT_PARAMS: SearchParams = {
    from: 1693958400,
    interval: 24 * 60 * 60,
    to: Math.floor(Date.now() / 1000),
};

export const maxDuration = 300;

export async function GET(req: NextRequest) {
    console.log("Starting cron job: set-volume-kv");
    // Parse and validate chainId
    const chainIdParam = req.nextUrl.searchParams.get("chainId");
    const chainId = Number(chainIdParam);
    const specifiers = CHAIN_SPECIFIERS as Record<string, string>;
    if (!chainIdParam || Number.isNaN(chainId) || !specifiers[chainId]) {
        return new Response(
            JSON.stringify({ error: `Invalid or missing chainId: ${chainIdParam}` }),
            { status: 400 },
        );
    }
    const chainSpecifier = specifiers[chainId];

    try {
        const ddog = new DDogClient(env.DD_API_KEY, env.DD_APP_KEY, chainSpecifier, env.DD_SERVICE);
        const { searchParams } = new URL(req.url);
        const params: SearchParams = {
            from: parseInt(searchParams.get("from") ?? String(DEFAULT_PARAMS.from)),
            interval: parseInt(searchParams.get("interval") ?? String(DEFAULT_PARAMS.interval)),
            to: parseInt(searchParams.get("to") ?? String(DEFAULT_PARAMS.to)),
        };

        console.log(`Parameters: ${JSON.stringify(params)}`);

        if (Object.values(params).some(Number.isNaN)) {
            console.error("Invalid parameters detected");
            return new Response(
                JSON.stringify({ error: "Invalid to, from, or interval parameter" }),
                { status: 400 },
            );
        }

        console.log(
            `Fetching match volume from ${params.from} to ${params.to} with interval ${params.interval}`,
        );
        const res = await ddog.getMatchVolumePerInterval(params.from, params.to, params.interval);
        console.log(`DDogClient response status: ${res.status}`);

        if (res.status === "ok" && res.series && res.series.length > 0 && res.series[0].pointlist) {
            console.log(
                `Raw data points: ${JSON.stringify(res.series[0].pointlist.slice(0, 5))}...`,
            ); // Log first 5 data points

            const volumeData = res.series[0].pointlist.map(([timestamp, volume]) => ({
                timestamp: Math.floor(timestamp / 1000), // Convert to seconds
                volume,
            }));

            console.log(`Processing ${volumeData.length} volume data points`);
            console.log(`Sample processed data: ${JSON.stringify(volumeData.slice(0, 5))}...`); // Log first 5 processed data points

            // Derive chain-aware KV keys
            const keyPrefix = getHistoricalVolumeKeyPrefix(chainId);
            const setKey = getHistoricalVolumeSetKey(chainId);

            let successCount = 0;
            const setPromises = volumeData.map(async (data: VolumeData, index) => {
                const key = `${keyPrefix}:${data.timestamp}`;
                try {
                    await kv.set(key, JSON.stringify(data));
                    await kv.sadd(setKey, key);
                    successCount++;
                    if (index % 10 === 0)
                        console.log(`Processed ${index + 1}/${volumeData.length} data points`);
                } catch (error) {
                    console.error(`Error processing data point ${index}:`, error);
                }
            });

            await Promise.all(setPromises);

            console.log(
                `Volume data successfully written to KV store. ${successCount}/${volumeData.length} points processed successfully`,
            );
            return new Response(
                JSON.stringify({
                    firstTimestamp: volumeData[0]?.timestamp,
                    lastTimestamp: volumeData[volumeData.length - 1]?.timestamp,
                    message: `Processed ${successCount}/${volumeData.length} volume data points`,
                }),
            );
        } else {
            console.error("Error fetching volume data:", res.error);
            console.log("Full response:", JSON.stringify(res));
            return new Response(JSON.stringify({ error: res.error || "No data found" }), {
                status: 500,
            });
        }
    } catch (error) {
        console.error("Error in cron job:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
        });
    }
}
