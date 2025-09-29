import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { getSDKConfig } from "@renegade-fi/react";
import { Token } from "@renegade-fi/token-nextjs";
import { createPublicClient, formatUnits, http } from "viem";
import { arbitrum, base } from "viem/chains";
import { getAlchemyRpcUrl } from "@/app/api/utils";
import { get_cursor, insert_darkpool_transfer_row, set_cursor } from "@/db/queries";
import { env } from "@/env/server";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { client as price_reporter_client } from "@/lib/clients/price-reporter";
import { extractSupportedChain } from "@/lib/viem";
import { classify, transfer_event } from "./classify";
import type {
    ClassifiedLog,
    DarkpoolTransferRow,
    LogLike,
    WithMeta,
    WithTime,
    WithUsdValue,
} from "./types";

const chain_ids = [arbitrum.id, base.id] as const;
type ChainId = (typeof chain_ids)[number];

export async function GET() {
    try {
        const sql = neon(env.ON_CHAIN_EVENTS_DATABASE_URL);

        for (const chain_id of chain_ids) {
            await run(sql, chain_id);
        }

        return new Response("Success", { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response("Error", { status: 500 });
    }
}

async function run(sql: NeonQueryFunction<false, false>, chain_id: ChainId) {
    // Get latest block
    const latest_block = await get_latest_block(chain_id);

    // Read cursor
    const cursor = await get_cursor(sql, chain_id);

    if (!cursor) {
        throw new Error(`Cursor not found for chain ${chain_id}`);
    }

    const darkpool_address = getSDKConfig(chain_id).darkpoolAddress;

    // Get Transfer logs
    // Fetch logs in parallel
    const [deposit_logs, withdrawal_logs] = await Promise.all([
        fetch_deposit_logs(darkpool_address, chain_id, cursor, latest_block),
        fetch_withdrawal_logs(darkpool_address, chain_id, cursor, latest_block),
    ]);

    // Classify as deposits or withdrawals or match
    const { kept, dropped_atomic_txs } = classify(deposit_logs, withdrawal_logs, chain_id);

    // Filter out invalid tokens
    const filtered_logs = filter_logs(kept);

    // Fetch token prices
    const prices = await fetch_token_prices(filtered_logs);

    // Fetch block timestamps
    const block_timestamps = await fetch_block_timestamps(filtered_logs, chain_id);

    // Create darkpool_transfer rows with notional value and insert into table
    await insert_rows(sql, filtered_logs, block_timestamps, prices);

    // Update cursor
    await set_cursor(sql, chain_id, latest_block, Buffer.from(""));

    console.log(`Inserted ${filtered_logs.length} rows`, {
        chain_id,
        darkpool_address,
        deposit_logs: deposit_logs.length,
        dropped_atomic_txs: dropped_atomic_txs.size,
        filtered_logs: filtered_logs.length,
        from_block: cursor,
        kept: kept.length,
        prices: prices.size,
        to_block: latest_block,
        withdrawal_logs: withdrawal_logs.length,
    });
}

async function insert_rows(
    sql: NeonQueryFunction<false, false>,
    logs: ClassifiedLog[],
    block_timestamps: Map<bigint, Date>,
    prices: Map<`0x${string}`, number>,
) {
    const rows = logs.map((log) => convert_to_darkpool_transfer_row(log, block_timestamps, prices));
    const insert_promises = rows.map((row) => insert_darkpool_transfer_row(sql, row));
    await Promise.all(insert_promises);
}

/**
 * Convert WithMeta logs to database input format
 */
function convert_to_darkpool_transfer_row(
    log: ClassifiedLog,
    block_timestamps: Map<bigint, Date>,
    token_prices: Map<`0x${string}`, number>,
): DarkpoolTransferRow {
    // Get block time
    const block_time = block_timestamps.get(log.blockNumber);
    if (!block_time) {
        throw new Error("Block timestamp not found");
    }

    const log_with_time: WithTime = {
        ...log,
        blockHash: "0x",
        blockTime: block_time,
    };

    // Get decimals
    const log_with_meta: WithMeta = {
        ...log_with_time,
        decimals: Token.fromAddress(log.token).decimals,
    };

    // Get notional USD value
    const price = token_prices.get(log.token);
    if (!price) {
        throw new Error("Price not found");
    }
    const usd_value = amountTimesPrice(log.value, price);
    const usd_value_number = Number(formatUnits(usd_value, log_with_meta.decimals));
    if (!usd_value_number) {
        throw new Error("USD value not found");
    }

    const log_with_usd_value: WithUsdValue = {
        ...log_with_meta,
        usd_value: usd_value_number,
    };

    return {
        amount_raw: log_with_usd_value.value.toString(),
        block_number: log_with_usd_value.blockNumber,
        block_time: log_with_usd_value.blockTime,
        chain_id: log_with_usd_value.chainId,
        decimals: log_with_usd_value.decimals,
        direction: log_with_usd_value.direction,
        from_address: Buffer.from(log_with_usd_value.from.slice(2), "hex"), // Remove 0x prefix and convert to Buffer
        to_address: Buffer.from(log_with_usd_value.to.slice(2), "hex"), // Remove 0x prefix and convert to Buffer
        token_address: Buffer.from(log_with_usd_value.token.slice(2), "hex"), // Remove 0x prefix and convert to Buffer
        tx_hash: Buffer.from(log_with_usd_value.txHash.slice(2), "hex"), // Remove 0x prefix and convert to Buffer
        usd_value: log_with_usd_value.usd_value,
    };
}

async function fetch_block_timestamps(
    logs: ClassifiedLog[],
    chain_id: ChainId,
): Promise<Map<bigint, Date>> {
    const client = get_rpc_client(chain_id);
    const blocks = [...new Set(logs.map((log) => log.blockNumber))];
    const timestamp_promises = blocks.map((block) =>
        client.getBlock({ blockNumber: block }).then((block) => block.timestamp),
    );
    const timestamps = await Promise.all(timestamp_promises);
    const block_to_timestamp = new Map(
        blocks.map((block, index) => [block, new Date(Number(timestamps[index]) * 1000)]),
    );
    return block_to_timestamp;
}

function filter_logs(logs: ClassifiedLog[]) {
    return logs.filter((log) => {
        const ticker = Token.fromAddressOnChain(log.token, log.chainId as ChainId).ticker;
        const isValid = ticker !== "UNKNOWN";

        if (!isValid) {
            console.log(`[tx-${log.txHash}] Token validation: FAIL - UNKNOWN token (${ticker})`);
        }

        return isValid;
    });
}

async function fetch_token_prices(logs: ClassifiedLog[]): Promise<Map<`0x${string}`, number>> {
    const tokens = [...new Set(logs.map((log) => log.token))];
    const price_promises = tokens.map(async (token) => {
        try {
            const price = await price_reporter_client.getPrice(token);
            return price;
        } catch (error) {
            console.log(
                `[price] Token ${token}: FAILED - ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    });

    const prices = await Promise.all(price_promises);
    const addr_to_price = new Map(tokens.map((token, index) => [token, prices[index]]));
    return addr_to_price;
}

function get_rpc_client(chain_id: ChainId) {
    const rpcUrl = getAlchemyRpcUrl(chain_id);
    return createPublicClient({
        chain: extractSupportedChain(chain_id),
        transport: http(rpcUrl),
    });
}

async function get_latest_block(chain_id: ChainId) {
    const client = get_rpc_client(chain_id);
    const latestBlock = await client.getBlockNumber();
    return latestBlock;
}

/**
 * Fetch deposit logs (transfers TO the darkpool)
 */
async function fetch_deposit_logs(
    darkpool_address: `0x${string}`,
    chain_id: ChainId,
    from_block: bigint,
    to_block: bigint,
): Promise<LogLike[]> {
    const client = get_rpc_client(chain_id);
    const logs = await client.getLogs({
        args: { to: darkpool_address },
        event: transfer_event,
        fromBlock: from_block,
        toBlock: to_block,
    });

    return logs.map((log) => ({
        address: log.address,
        blockNumber: log.blockNumber,
        data: log.data,
        logIndex: log.logIndex,
        topics: log.topics,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
    }));
}

/**
 * Fetch withdrawal logs (transfers FROM the darkpool)
 */
async function fetch_withdrawal_logs(
    darkpool_address: `0x${string}`,
    chain_id: ChainId,
    from_block: bigint,
    to_block: bigint,
): Promise<LogLike[]> {
    const client = get_rpc_client(chain_id);
    const logs = await client.getLogs({
        args: { from: darkpool_address },
        event: transfer_event,
        fromBlock: from_block,
        toBlock: to_block,
    });

    return logs.map((log) => ({
        address: log.address,
        blockNumber: log.blockNumber,
        data: log.data,
        logIndex: log.logIndex,
        topics: log.topics,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
    }));
}
