import { useQuery, UseQueryResult } from "@tanstack/react-query"

interface VolumeParams {
    from: number;
    to?: number;
    interval?: number;
}

interface VolumeDataPoint {
    timestamp: string;
    data: number;
}

type UseHistoricalVolumeResult = UseQueryResult<VolumeDataPoint[], Error> & {
    queryKey: readonly ["stats", "historical-volume", { from: number; to: number; interval: number }];
};

/**
 * Hook to fetch volume data for a specific interval. 
 * NOTE: Interval does not seem to affect the result, seems like the API automatically adjusts based on the 'from' and 'to' parameters.
 * @param params - Object containing 'from' (required), 'to' (optional), and 'interval' (optional) timestamps in seconds.
 * Note: 'from' and 'to' must be Unix timestamps in seconds, not milliseconds.
 */
export function useVolumeData({ from, to, interval }: VolumeParams): UseHistoricalVolumeResult {
    const now = Math.floor(Date.now() / 1000);
    const finalTo = to ?? now;
    const finalInterval = interval ?? 86400; // 1 day

    const queryKey = ["stats", "historical-volume", { from, to: finalTo, interval: finalInterval }] as const;

    return {
        ...useQuery<VolumeDataPoint[], Error>({
            queryKey,
            queryFn: () => getHistoricalVolume({ from, to: finalTo, interval: finalInterval }),
            staleTime: Infinity,
        }),
        queryKey,
    };
}

export async function getHistoricalVolume({ from, to, interval }: VolumeParams) {
    const searchParams = new URLSearchParams();
    searchParams.append('from', from.toString());
    if (to) searchParams.append('to', to.toString());
    if (interval) searchParams.append('interval', interval.toString());

    const url = `/api/stats/historical-volume?${searchParams.toString()}`;
    const res = await fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } }).then((res) => res.json());
    if (res.error) {
        throw new Error(res.error);
    }
    return res.data.map((item: [number, number]) => ({
        timestamp: item[0].toString(),
        data: item[1],
    }));
}