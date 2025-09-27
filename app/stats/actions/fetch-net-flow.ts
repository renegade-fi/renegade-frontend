"use server";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { env } from "@/env/server";

export interface NetFlowData {
    netFlow: number;
    chainId?: number;
}

/**
 * Fetch 24-hour net flow data from Neon database
 * Uses single CTE query for optimal performance
 */
export async function fetchNetFlow(chainId?: number): Promise<NetFlowData> {
    try {
        const sql = neon(env.ON_CHAIN_EVENTS_DATABASE_URL);

        // Single CTE query replaces multiple separate queries
        const { netFlow, latestTimestamp } = await calculateNetFlowWithCTE(sql, chainId);

        if (!latestTimestamp) {
            return {
                chainId,
                netFlow: 0,
            };
        }

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

/**
 * Calculate net flow using a single CTE query for better performance
 */
async function calculateNetFlowWithCTE(
    sql: NeonQueryFunction<false, false>,
    chainId?: number,
): Promise<{ netFlow: number; latestTimestamp: Date | null }> {
    const result = await sql`
        WITH latest_timestamp AS (
            SELECT MAX(ts_minute) as ts 
            FROM darkpool_transfer 
            WHERE ${chainId ? sql`chain_id = ${chainId} AND` : sql``} usd_value IS NOT NULL
        ),
        net_flow AS (
            SELECT COALESCE(
                SUM(CASE 
                    WHEN direction = 'deposit' THEN usd_value
                    ELSE -usd_value
                END), 
                0
            ) as net_flow
            FROM darkpool_transfer, latest_timestamp
            WHERE ${chainId ? sql`chain_id = ${chainId} AND` : sql``}
            ts_minute >= (latest_timestamp.ts - INTERVAL '24 hours')
            AND ts_minute <= latest_timestamp.ts
            AND usd_value IS NOT NULL
        )
        SELECT 
            net_flow.net_flow,
            latest_timestamp.ts as latest_timestamp
        FROM net_flow, latest_timestamp
    `;

    const row = result[0];
    return {
        latestTimestamp: row?.latest_timestamp || null,
        netFlow: parseFloat(row?.net_flow?.toString() || "0"),
    };
}
