export function getInflowsSetKey(chainId: number): string {
    return `stats:inflows:${chainId}:set`;
}

export function getInflowsKey(chainId: number): string {
    return `stats:inflows:${chainId}`;
}

export function getLastProcessedBlockKey(chainId: number): string {
    return `stats:inflows:${chainId}:last_processed_block`;
}

export type ExternalTransferData = {
    timestamp: number;
    amount: number;
    isWithdrawal: boolean;
    mint: string;
    transactionHash: string;
};

export type BucketData = {
    timestamp: string;
    depositAmount: number;
    withdrawalAmount: number;
};

export type LogCountRange = {
    min: number;
    max: number;
};

// Chain-specific expected log count ranges for valid deposits/withdrawals
const EXPECTED_LOG_COUNT_RANGES: Record<number, LogCountRange> = {
    8453: { max: 38, min: 36 }, // Base mainnet
    42161: { max: 38, min: 36 }, // Arbitrum One
};

export function getExpectedLogCountRange(chainId: number): LogCountRange {
    const expectedRange = EXPECTED_LOG_COUNT_RANGES[chainId];
    if (expectedRange === undefined) {
        throw new Error(`No expected log count range configured for chain ID: ${chainId}`);
    }
    return expectedRange;
}

export function isValidLogCount(logCount: number, chainId: number): boolean {
    const range = getExpectedLogCountRange(chainId);
    return logCount >= range.min && logCount <= range.max;
}

// Volume

export function getHistoricalVolumeKeyPrefix(chainId: number): string {
    return `stats:historical-volume:${chainId}`;
}

export function getHistoricalVolumeSetKey(chainId: number): string {
    return `stats:historical-volume:${chainId}:set`;
}

// Flows

const NET_FLOW_KEY = "net_flow_24h";

export function getNetFlowKey(chainId: number): string {
    return `${NET_FLOW_KEY}:${chainId}`;
}
