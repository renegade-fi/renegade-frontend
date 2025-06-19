"use client";

import type { ChainId } from "@renegade-fi/react/constants";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { getConfigFromChainId } from "../renegade-provider/config";
import { useWasm } from "../renegade-provider/wasm-provider";
import { type CachedWallet, createEmptyWallet } from "./schema";
import { useServerStore } from "./server-store-provider";

/**
 * Returns the active chain ID from server state.
 */
export function useCurrentChain(): ChainId {
    return useServerStore((s) => s.chainId);
}

/** Stable reference to an empty wallet. */
const EMPTY_WALLET = createEmptyWallet();

/**
 * Returns the wallet entry (seed & id) for the active chain.
 */
export function useCurrentWallet(): CachedWallet {
    const chain = useCurrentChain();
    return useServerStore(useShallow((s) => s.wallet.get(chain) ?? EMPTY_WALLET));
}

/**
 * Returns true if both seed and id are present for the active chain.
 */
export function useIsWalletConnected(): boolean {
    const { seed, id } = useCurrentWallet();
    return Boolean(seed && id);
}

/**
 * Returns a config object with the current wallet and chain id.
 * Importantly, this reacts to changes in the wallet and chain id.
 */
export function useConfig() {
    const { isInitialized } = useWasm();
    const chainId = useCurrentChain();
    const wallet = useCurrentWallet();

    return useMemo(() => {
        if (!wallet.seed || !wallet.id || !isInitialized) return;
        const config = getConfigFromChainId(chainId);
        config.setState((s) => ({
            ...s,
            seed: wallet.seed,
            id: wallet.id,
            chainId,
            status: "in relayer",
        }));
        return config;
    }, [chainId, isInitialized, wallet.id, wallet.seed]);
}

export function useRememberMe(): boolean {
    const chainId = useCurrentChain();
    const rememberMe = useServerStore((s) => s.rememberMe.get(chainId));
    return rememberMe ?? false;
}
