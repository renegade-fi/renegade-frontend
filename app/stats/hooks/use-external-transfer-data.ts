import { useQuery } from "@tanstack/react-query";

import type { BucketData } from "@/app/api/stats/constants";
import type { ExternalTransferLogsResponse } from "@/app/api/stats/external-transfer-logs/route";

import { env } from "@/env/client";

export type TransferData = Map<number, BucketData>;

export function useExternalTransferLogs({
    intervalMs = 86400000,
    chainId,
}: {
    intervalMs?: number;
    chainId: number;
}) {
    const queryKey = ["stats", "externalTransferLogs", intervalMs, chainId];

    return {
        ...useQuery<TransferData, Error>({
            enabled: env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet",
            queryFn: () => fetchExternalTransferLogs(intervalMs, chainId),
            queryKey,
            staleTime: Infinity,
        }),
        queryKey,
    };
}

const fetchExternalTransferLogs = async (
    intervalMs: number,
    chainId: number,
): Promise<TransferData> => {
    const response = await fetch(
        `/api/stats/external-transfer-logs?interval=${intervalMs}&chainId=${chainId}`,
    );
    if (!response.ok) {
        throw new Error("Failed to fetch external transfer logs");
    }
    const res = (await response.json()) as ExternalTransferLogsResponse;
    const transferData = new Map<number, BucketData>();
    for (const point of res.data) {
        transferData.set(Number(point.timestamp), point);
    }
    return transferData;
};
