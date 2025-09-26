"use server";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { env } from "@/env/server";

export interface NetFlowData {
    netFlow: number;
    chainId?: number;
}

/**
 * Find the most recent timestamp that has a non-null usd_value
 */
async function findLatestTimestampWithUsdValue(
    sql: NeonQueryFunction<false, false>,
    chainId?: number,
): Promise<Date | null> {
    const result = chainId
        ? await sql`
            SELECT MAX(ts_minute) as latest_timestamp
            FROM darkpool_transfer 
            WHERE chain_id = ${chainId}
            AND usd_value IS NOT NULL
        `
        : await sql`
            SELECT MAX(ts_minute) as latest_timestamp
            FROM darkpool_transfer 
            WHERE usd_value IS NOT NULL
        `;

    return result[0]?.latest_timestamp || null;
}

/**
 * Calculate the 24-hour window start time from the latest timestamp
 */
function calculate24HourWindow(latestTimestamp: Date): { start: Date; end: Date } {
    const windowStart = new Date(latestTimestamp);
    windowStart.setHours(windowStart.getHours() - 24);

    return {
        end: latestTimestamp,
        start: windowStart,
    };
}

/**
 * Get a breakdown of deposits and withdrawals in the time window
 */
async function getDataBreakdown(
    sql: NeonQueryFunction<false, false>,
    windowStart: Date,
    windowEnd: Date,
    chainId?: number,
) {
    const result = chainId
        ? await sql`
            SELECT 
                direction,
                COUNT(*) as count,
                SUM(usd_value) as total_usd_value,
                AVG(usd_value) as avg_usd_value
            FROM darkpool_transfer 
            WHERE chain_id = ${chainId}
            AND ts_minute >= ${windowStart}
            AND ts_minute <= ${windowEnd}
            AND usd_value IS NOT NULL
            GROUP BY direction
        `
        : await sql`
            SELECT 
                direction,
                COUNT(*) as count,
                SUM(usd_value) as total_usd_value,
                AVG(usd_value) as avg_usd_value
            FROM darkpool_transfer 
            WHERE ts_minute >= ${windowStart}
            AND ts_minute <= ${windowEnd}
            AND usd_value IS NOT NULL
            GROUP BY direction
        `;

    return result;
}

/**
 * Calculate the net flow (deposits - withdrawals) for the time window
 */
async function calculateNetFlow(
    sql: NeonQueryFunction<false, false>,
    windowStart: Date,
    windowEnd: Date,
    chainId?: number,
): Promise<number> {
    const result = chainId
        ? await sql`
            SELECT COALESCE(
                SUM(CASE 
                    WHEN direction = 'deposit' THEN usd_value
                    ELSE -usd_value
                END), 
                0
            ) as net_flow
            FROM darkpool_transfer 
            WHERE chain_id = ${chainId}
            AND ts_minute >= ${windowStart}
            AND ts_minute <= ${windowEnd}
            AND usd_value IS NOT NULL
        `
        : await sql`
            SELECT COALESCE(
                SUM(CASE 
                    WHEN direction = 'deposit' THEN usd_value
                    ELSE -usd_value
                END), 
                0
            ) as net_flow
            FROM darkpool_transfer 
            WHERE ts_minute >= ${windowStart}
            AND ts_minute <= ${windowEnd}
            AND usd_value IS NOT NULL
        `;

    return parseFloat(result[0]?.net_flow?.toString() || "0");
}

/**
 * Fetch 24-hour net flow data from Neon database
 * Computes net flow server-side using SQL aggregation
 */
export async function fetchNetFlow(chainId?: number): Promise<NetFlowData> {
    try {
        const sql = neon(env.ON_CHAIN_EVENTS_DATABASE_URL);

        // Step 1: Find the latest timestamp with non-null usd_value
        const latestTimestamp = await findLatestTimestampWithUsdValue(sql, chainId);

        if (!latestTimestamp) {
            return {
                chainId,
                netFlow: 0,
            };
        }

        // Step 2: Calculate the 24-hour window
        const { start: windowStart, end: windowEnd } = calculate24HourWindow(latestTimestamp);

        // Step 3: Get data breakdown for debugging
        const dataBreakdown = await getDataBreakdown(sql, windowStart, windowEnd, chainId);

        // Step 4: Calculate net flow
        const netFlow = await calculateNetFlow(sql, windowStart, windowEnd, chainId);

        return {
            chainId,
            netFlow,
        };
    } catch (error) {
        console.error("Error fetching net flow:", error);
        return {
            chainId,
            netFlow: 0,
        };
    }
}
