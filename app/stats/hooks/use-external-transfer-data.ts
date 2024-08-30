import { BucketData } from "@/app/api/stats/constants";
import { ExternalTransferLogsResponse } from '@/app/api/stats/external-transfer-logs/route';
import { useQuery } from '@tanstack/react-query';

export function useExternalTransferLogs(intervalMs: number = 86400000) {
    const queryKey = ['stats', 'externalTransferLogs', intervalMs];

    return {
        ...useQuery<BucketData[], Error>({
            queryKey,
            queryFn: () => fetchExternalTransferLogs(intervalMs),
            staleTime: Infinity,
        }),
        queryKey,
    };
}

const fetchExternalTransferLogs = async (intervalMs: number): Promise<BucketData[]> => {
    const response = await fetch(`/api/stats/external-transfer-logs?interval=${intervalMs}`, {
        cache: 'force-cache',
        next: { revalidate: 3600 }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch external transfer logs');
    }
    const res = await response.json() as ExternalTransferLogsResponse;
    return res.data;
};