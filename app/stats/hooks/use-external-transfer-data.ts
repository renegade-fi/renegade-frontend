import { useQuery } from '@tanstack/react-query';
import { ExternalTransferDayData, ExternalTransferResponse } from '@/app/api/chain/external-transfer-logs/route';

export function useExternalTransferLogs() {
    const queryKey = ['stats', 'externalTransferLogs'];

    return {
        ...useQuery<ExternalTransferDayData[], Error>({
            queryKey,
            queryFn: () => fetchExternalTransferLogs(),
            staleTime: Infinity,
        }),
        queryKey,
    };
}

const fetchExternalTransferLogs = async (): Promise<ExternalTransferDayData[]> => {
    const response = await fetch(`/api/chain/external-transfer-logs`, {
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error('Failed to fetch external transfer logs');
    }
    const res = await response.json() as ExternalTransferResponse;
    return res.data;
};