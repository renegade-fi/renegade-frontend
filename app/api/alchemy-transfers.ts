import { getSDKConfig } from "@renegade-fi/react";

import { getAlchemyRpcUrl } from "@/app/api/utils";

import { DISPLAY_TOKENS } from "@/lib/token";

export interface AlchemyTransfer {
    blockNum: string;
    hash: string;
    from: string;
    to: string;
    rawContract: {
        value: string;
        address: string;
        decimal: string;
    };
    metadata: {
        blockTimestamp: string;
    };
}

/**
 * Fetches all ERC-20 asset transfers from Alchemy, paginated, filtered by darkpool address.
 * @param fromBlock - Hex string (e.g., "0x1234") to start from
 * @param isWithdrawal - If true, filter by fromAddress (withdrawals), else toAddress (deposits)
 * @param chainId - Chain ID for Alchemy RPC and darkpool address
 */
export async function getAssetTransfers({
    fromBlock,
    isWithdrawal,
    chainId,
}: {
    fromBlock: bigint;
    isWithdrawal: boolean;
    chainId: number;
}): Promise<AlchemyTransfer[]> {
    const darkpool = getSDKConfig(chainId).darkpoolAddress.toLowerCase();
    const tokenAddresses = DISPLAY_TOKENS({ chainId }).map((t) => t.address);
    const baseParams: Record<string, any> = {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: "latest",
        contractAddresses: tokenAddresses,
        category: ["erc20"],
        withMetadata: true,
        excludeZeroValue: false,
        maxCount: "0xa",
        order: "desc",
    };
    // set direction
    if (isWithdrawal) baseParams.fromAddress = darkpool;
    else baseParams.toAddress = darkpool;

    const result: AlchemyTransfer[] = [];
    let pageKey: string | undefined;

    do {
        const params: Record<string, any> = {
            ...baseParams,
            ...(pageKey ? { pageKey } : {}),
        };
        const body: string = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getAssetTransfers",
            params: [params],
        });
        const response: Response = await fetch(getAlchemyRpcUrl(chainId), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
        });
        if (!response.ok) {
            throw new Error(`Alchemy getAssetTransfers HTTP error: ${response.status}`);
        }
        const json: any = await response.json();
        const transfers = json.result.transfers as AlchemyTransfer[];
        result.push(...transfers);
        pageKey = json.result.pageKey;
    } while (pageKey);

    return result;
}
