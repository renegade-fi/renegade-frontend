import type { AlchemyTransfer } from "@/app/api/alchemy-transfers";
import { getExpectedLogCountRange, isValidLogCount } from "@/app/api/stats/constants";
import { getAlchemyRpcUrl } from "@/app/api/utils";

// Helper function to chunk arrays into smaller batches
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Helper function to fetch transaction receipt and return log count
export async function fetchTransactionReceipt(
    transactionHash: string,
    rpcUrl: string,
): Promise<number | null> {
    try {
        const response = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "eth_getTransactionReceipt",
                params: [transactionHash],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        if (!response.ok) {
            console.error(`HTTP error fetching receipt for ${transactionHash}: ${response.status}`);
            return null;
        }

        const result = await response.json();
        if (result.error) {
            console.error(
                `RPC error fetching receipt for ${transactionHash}: ${result.error.message}`,
            );
            return null;
        }

        if (!result.result || !result.result.logs) {
            console.error(`No logs found in receipt for ${transactionHash}`);
            return null;
        }

        return result.result.logs.length;
    } catch (error) {
        console.error(`Error fetching receipt for ${transactionHash}:`, error);
        return null;
    }
}

// Helper function to validate transfers by log count in parallel batches
export async function validateTransferLogCounts(
    transfers: AlchemyTransfer[],
    chainId: number,
    batchSize: number = 10,
): Promise<AlchemyTransfer[]> {
    if (transfers.length === 0) {
        return transfers;
    }

    const rpcUrl = getAlchemyRpcUrl(chainId);
    const expectedRange = getExpectedLogCountRange(chainId);
    const chunks = chunkArray(transfers, batchSize);

    console.log(
        `Validating ${transfers.length} transfers in ${chunks.length} batches of ${batchSize} (expected log count: ${expectedRange.min}-${expectedRange.max})`,
    );

    const validatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
            const validationPromises = chunk.map(async (transfer) => {
                const logCount = await fetchTransactionReceipt(transfer.hash, rpcUrl);
                const isValid = logCount !== null && isValidLogCount(logCount, chainId);

                if (logCount !== null && !isValid) {
                    console.log(
                        `Filtered transfer ${transfer.hash}: expected ${expectedRange.min}-${expectedRange.max} logs, got ${logCount}`,
                    );
                }

                if (isValid) {
                    console.log(`Accepted transfer ${transfer.hash} with ${logCount} logs`);
                }

                return isValid ? transfer : null;
            });

            const results = await Promise.all(validationPromises);
            return results.filter((transfer): transfer is AlchemyTransfer => transfer !== null);
        }),
    );

    const validTransfers = validatedChunks.flat();
    const filteredCount = transfers.length - validTransfers.length;

    console.log(
        `Filtered out ${filteredCount} transfers with log counts outside the expected range`,
    );
    return validTransfers;
}
