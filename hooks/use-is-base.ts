"use client";

import { useMemo } from "react";

import { base, baseSepolia } from "viem/chains";

import { useCurrentChain } from "@/providers/state-provider/hooks";

const BASE_CHAINS = [baseSepolia.id, base.id] as const;

/**
 * Returns true if the chain is Base
 * Checks the id passed in, or the id used to generate the Renegade wallet seed
 */
export function useIsBase(chainId?: number) {
    const currentChain = useCurrentChain();
    return useMemo(() => {
        if (chainId) {
            return BASE_CHAINS.includes(chainId as any);
        }
        if (BASE_CHAINS.includes(currentChain as any)) {
            return true;
        }
        return false;
    }, [chainId, currentChain]);
}
