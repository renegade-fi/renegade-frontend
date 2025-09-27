import type { NeonQueryFunction } from "@neondatabase/serverless";
import type { DarkpoolTransferRow } from "@/app/api/crons/darkpool-flow/types";

// ------------------
// | Cursor Queries |
// ------------------

export async function get_cursor(
    sql: NeonQueryFunction<false, false>,
    chain_id: number,
): Promise<bigint | null> {
    const result = await sql`
        SELECT last_processed_block FROM ingestion_cursor WHERE chain_id = ${chain_id}
    `;
    return result.length > 0 ? BigInt(result[0]?.last_processed_block ?? 0) : null;
}

export async function set_cursor(
    sql: NeonQueryFunction<false, false>,
    chain_id: number,
    block_number: bigint,
    block_hash: Buffer,
): Promise<void> {
    await sql`
        INSERT INTO ingestion_cursor (chain_id, last_processed_block, last_processed_block_hash)
        VALUES (${chain_id}, ${block_number.toString()}, ${block_hash})
        ON CONFLICT (chain_id) 
        DO UPDATE SET 
          last_processed_block = ${block_number.toString()},
          last_processed_block_hash = ${block_hash},
          updated_at = now()
    `;
}

// ---------------------
// | Darkpool Transfer |
// ---------------------

export async function insert_darkpool_transfer_row(
    sql: NeonQueryFunction<false, false>,
    transfer: DarkpoolTransferRow,
): Promise<void> {
    await sql`
        INSERT INTO darkpool_transfer (
            chain_id, block_number, block_time, tx_hash,
            token_address, from_address, to_address, amount_raw, decimals, direction,
            ts_minute, day
        ) VALUES (
            ${transfer.chain_id},
            ${transfer.block_number.toString()},
            ${transfer.block_time.toISOString()},
            ${transfer.tx_hash},
            ${transfer.token_address},
            ${transfer.from_address},
            ${transfer.to_address},
            ${transfer.amount_raw},
            ${transfer.decimals},
            ${transfer.direction},
            date_trunc('minute', ${transfer.block_time.toISOString()}::timestamptz),
            (date_trunc('day', ${transfer.block_time.toISOString()}::timestamptz))::date
        )
        ON CONFLICT (tx_hash) DO UPDATE SET
            chain_id = EXCLUDED.chain_id,
            block_number = EXCLUDED.block_number,
            block_time = EXCLUDED.block_time,
            token_address = EXCLUDED.token_address,
            from_address = EXCLUDED.from_address,
            to_address = EXCLUDED.to_address,
            amount_raw = EXCLUDED.amount_raw,
            decimals = EXCLUDED.decimals,
            direction = EXCLUDED.direction,
            ts_minute = EXCLUDED.ts_minute,
            day = EXCLUDED.day
    `;
}
