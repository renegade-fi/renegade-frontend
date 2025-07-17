import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";

import { resolveTickerAndChain } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

async function fetchCombinedBalances(address: `0x${string}`, solanaAddress?: string) {
    const params = new URLSearchParams({
        address: address,
    });

    if (solanaAddress) {
        params.append("solanaAddress", solanaAddress);
    }

    const response = await fetch(`/api/tokens/get-combined-balances?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Failed to fetch combined balances");
    }
    return response.json();
}

export function useCombinedBalances({
    address,
    enabled = true,
}: {
    address?: `0x${string}`;
    enabled?: boolean;
}) {
    const chainId = useCurrentChain();
    const { publicKey } = useWallet();
    const solanaAddress = publicKey?.toBase58();
    const queryKey = ["combinedBalances", address, solanaAddress];

    return {
        queryKey,
        ...useQuery<Map<`0x${string}`, bigint>, Error>({
            enabled: !!address && enabled,
            queryFn: () => fetchCombinedBalances(address!, solanaAddress),
            queryKey,
            select: (data) =>
                Object.entries(data).reduce((acc, [key, value]) => {
                    const token = resolveTickerAndChain(key, chainId);
                    if (!token) {
                        return acc;
                    }
                    acc.set(token.address, BigInt(value));
                    return acc;
                }, new Map<`0x${string}`, bigint>()),
        }),
    };
}
