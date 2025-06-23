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
