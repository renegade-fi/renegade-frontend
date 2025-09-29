import { decodeEventLog, parseAbiItem } from "viem";
import type { ClassifiedLog, LogLike } from "./types";

// ERC20 Transfer event ABI
export const transfer_event = parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 value)",
);

/**
 * Process logs and classify them into deposits/withdrawals
 */
function process_logs(
    logs: LogLike[],
    direction: "deposit" | "withdrawal",
    chain_id: number,
    by_tx: Map<
        `0x${string}`,
        { has_deposit: boolean; has_withdrawal: boolean; events: ClassifiedLog[] }
    >,
): void {
    for (const log of logs) {
        try {
            // Decode the transfer event
            const decoded = decodeEventLog({
                abi: [transfer_event],
                data: log.data,
                topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
            });

            const { from, to, value } = decoded.args as {
                from: `0x${string}`;
                to: `0x${string}`;
                value: bigint;
            };

            // Skip zero-address legs
            if (direction === "deposit" && from === "0x0000000000000000000000000000000000000000") {
                continue;
            }
            if (direction === "withdrawal" && to === "0x0000000000000000000000000000000000000000") {
                continue;
            }

            const classified_log: ClassifiedLog = {
                blockNumber: log.blockNumber,
                chainId: chain_id,
                direction: direction,
                from: from.toLowerCase() as `0x${string}`,
                logIndex: log.logIndex,
                to: to.toLowerCase() as `0x${string}`,
                token: log.address.toLowerCase() as `0x${string}`,
                txHash: log.transactionHash,
                txIndex: log.transactionIndex || 0,
                value: value,
            };

            // Group by transaction hash
            const tx_hash = log.transactionHash;
            const bucket = by_tx.get(tx_hash) ?? {
                events: [],
                has_deposit: false,
                has_withdrawal: false,
            };

            if (direction === "deposit") bucket.has_deposit = true;
            if (direction === "withdrawal") bucket.has_withdrawal = true;
            bucket.events.push(classified_log);
            by_tx.set(tx_hash, bucket);
        } catch (error) {
            console.log(
                `[tx-${log.transactionHash}] FAILED to decode log: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}

/**
 * Classify transfer logs into deposits/withdrawals and filter out atomic transactions
 */
export function classify(
    deposit_logs: LogLike[],
    withdrawal_logs: LogLike[],
    chain_id: number,
): { kept: ClassifiedLog[]; dropped_atomic_txs: Set<`0x${string}`> } {
    // Group by transaction hash to detect atomic transactions
    const by_tx = new Map<
        `0x${string}`,
        { has_deposit: boolean; has_withdrawal: boolean; events: ClassifiedLog[] }
    >();

    // Process both deposit and withdrawal logs
    process_logs(deposit_logs, "deposit", chain_id, by_tx);
    process_logs(withdrawal_logs, "withdrawal", chain_id, by_tx);

    const kept: ClassifiedLog[] = [];
    const dropped_atomic_txs = new Set<`0x${string}`>();

    // Filter out atomic transactions (those with both deposits and withdrawals)
    for (const [tx_hash, info] of by_tx) {
        if (info.has_deposit && info.has_withdrawal) {
            // Atomic transaction - drop all events from this transaction
            console.log(`[tx-${tx_hash}] DROPPED`);
            dropped_atomic_txs.add(tx_hash);
            continue;
        }
        // Keep events from non-atomic transactions
        const events = info.events;
        events.forEach((event) => {
            console.log(`[tx-${tx_hash}] KEPT - ${event.direction}`);
        });
        kept.push(...events);
    }

    return { dropped_atomic_txs, kept };
}
