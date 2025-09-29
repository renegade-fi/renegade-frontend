// Application-level types (not database-specific)

import type { Direction } from "@/lib/types";

export interface ClassifiedLog {
    chainId: number;
    blockNumber: bigint;
    txHash: `0x${string}`;
    txIndex: number;
    logIndex: number;
    token: `0x${string}`;
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
    direction: Direction;
}

export interface WithTime extends ClassifiedLog {
    blockHash: `0x${string}`;
    blockTime: Date;
}

export interface WithMeta extends WithTime {
    decimals: number;
}

export interface WithUsdValue extends WithMeta {
    usd_value: number;
}

export interface LogLike {
    address: `0x${string}`;
    blockNumber: bigint;
    transactionHash: `0x${string}`;
    transactionIndex?: number;
    logIndex: number;
    topics: `0x${string}`[];
    data: `0x${string}`;
}

// Database types
export interface DarkpoolTransferRow {
    chain_id: number;
    block_number: bigint;
    block_time: Date;
    tx_hash: Buffer;
    token_address: Buffer;
    from_address: Buffer;
    to_address: Buffer;
    usd_value: number;
    amount_raw: string;
    decimals: number;
    direction: "deposit" | "withdrawal";
}
