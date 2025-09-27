"use server";

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { env } from "@/env/server";

export interface TransferData {
    date: string;
    arbitrumDeposits: number;
    arbitrumWithdrawals: number;
    baseDeposits: number;
    baseWithdrawals: number;
}

/**
 * Fetch raw transfer data from the database grouped by day and chain
 */
async function fetchRawTransferData(sql: NeonQueryFunction<false, false>, chainId?: number) {
    return chainId
        ? await sql`
            SELECT 
                day as date,
                chain_id,
                SUM(CASE WHEN direction = 'deposit' THEN usd_value ELSE 0 END) as deposit_amount,
                SUM(CASE WHEN direction = 'withdrawal' THEN usd_value ELSE 0 END) as withdrawal_amount
            FROM darkpool_transfer 
            WHERE usd_value IS NOT NULL AND chain_id = ${chainId}
            GROUP BY day, chain_id 
            ORDER BY day DESC
        `
        : await sql`
            SELECT 
                day as date,
                chain_id,
                SUM(CASE WHEN direction = 'deposit' THEN usd_value ELSE 0 END) as deposit_amount,
                SUM(CASE WHEN direction = 'withdrawal' THEN usd_value ELSE 0 END) as withdrawal_amount
            FROM darkpool_transfer 
            WHERE usd_value IS NOT NULL
            GROUP BY day, chain_id 
            ORDER BY day DESC
        `;
}

/**
 * Format a date object to YYYY-MM-DD string
 */
function formatDateToString(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Parse numeric values from database results
 */
function parseNumericValue(value: number): number {
    return parseFloat(value.toString());
}

/**
 * Create an empty TransferData object for a given date
 */
function createEmptyTransferData(date: string): TransferData {
    return {
        arbitrumDeposits: 0,
        arbitrumWithdrawals: 0,
        baseDeposits: 0,
        baseWithdrawals: 0,
        date,
    };
}

/**
 * Assign transfer amounts to the appropriate chain in the TransferData object
 */
function assignTransferAmounts(
    transferData: TransferData,
    chainId: number,
    deposits: number,
    withdrawals: number,
): void {
    if (chainId === 42161) {
        // Arbitrum
        transferData.arbitrumDeposits = deposits;
        transferData.arbitrumWithdrawals = -withdrawals; // Negative for chart visualization
    } else if (chainId === 8453) {
        // Base
        transferData.baseDeposits = deposits;
        transferData.baseWithdrawals = -withdrawals; // Negative for chart visualization
    }
}

/**
 * Process raw database results into TransferData objects
 */
function processTransferData(rawData: any[]): TransferData[] {
    const dataMap = new Map<string, TransferData>();

    rawData.forEach((row) => {
        const date = formatDateToString(row.date);
        const deposits = parseNumericValue(row.deposit_amount);
        const withdrawals = parseNumericValue(row.withdrawal_amount);

        let existing = dataMap.get(date);
        if (!existing) {
            existing = createEmptyTransferData(date);
            dataMap.set(date, existing);
        }

        assignTransferAmounts(existing, row.chain_id, deposits, withdrawals);
    });

    return Array.from(dataMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
}

/**
 * Fetch cumulative transfer data from Neon database
 * Returns daily aggregated deposit and withdrawal amounts by chain
 * Compatible with updated schema (removed block_hash, tx_index, log_index)
 */
export async function fetchTransferData(chainId?: number): Promise<TransferData[]> {
    try {
        const sql = neon(env.ON_CHAIN_EVENTS_DATABASE_URL);

        // Step 1: Fetch raw data from database
        const rawData = await fetchRawTransferData(sql, chainId);

        // Step 2: Process and transform the data
        const processedData = processTransferData(rawData);

        return processedData;
    } catch (error) {
        console.error("Error fetching transfer data:", error);
        return [];
    }
}
