import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import type {
    HistoricalVolumeResponse,
    VolumeDataPoint,
} from "@/app/api/stats/historical-volume-kv/route";

import { env } from "@/env/client";

export type VolumeData = Map<number, VolumeDataPoint>;

type UseHistoricalVolumeResult = UseQueryResult<VolumeData, Error> & {
    queryKey: readonly ["stats", "historical-volume", number];
};

/**
 * Hook to fetch all historical volume data.
 */
export function useVolumeData(chainId: number): UseHistoricalVolumeResult {
    const queryKey = ["stats", "historical-volume", chainId] as const;

    return {
        ...useQuery<VolumeData, Error>({
            enabled: env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet",
            queryFn: () => getHistoricalVolume(chainId),
            queryKey,
            staleTime: Infinity,
        }),
        queryKey,
    };
}

async function getHistoricalVolume(chainId: number): Promise<VolumeData> {
    const res = await fetch(`/api/stats/historical-volume-kv?chainId=${chainId}`);

    if (!res.ok) {
        throw new Error(`Failed to fetch historical volume data: ${res.statusText}`);
    }

    const data: HistoricalVolumeResponse = await res.json();

    // Filter data for entries after 1725321600
    const filteredData = data.data.filter((point) => point.timestamp >= 1725321600);

    const volumeData = new Map<number, VolumeDataPoint>();
    for (const point of filteredData) {
        volumeData.set(point.timestamp, point);
    }

    return volumeData;
}
