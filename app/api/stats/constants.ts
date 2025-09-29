// Volume

export function getHistoricalVolumeKeyPrefix(chainId: number): string {
    return `stats:historical-volume:${chainId}`;
}

export function getHistoricalVolumeSetKey(chainId: number): string {
    return `stats:historical-volume:${chainId}:set`;
}
