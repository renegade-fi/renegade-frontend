import type { Config as RenegadeConfig } from "@renegade-fi/react";
import { createPublicClient, http, type PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { getAccount, getChainId } from "wagmi/actions";
import { extractSupportedChain } from "@/lib/viem";
import type { StepExecutionContext } from "../types";

/**
 * Create an execution context for multi-chain transaction steps.
 *
 * Provides memoized chain clients and wallet access methods.
 */
export function makeExecutionContext(
    renegadeConfig: RenegadeConfig,
    wagmiConfig: WagmiConfig,
    keychainNonce: bigint,
): StepExecutionContext {
    // Memoised per-chain public clients
    const pcCache = new Map<number, PublicClient>();

    function getPublicClient(chainId: number): PublicClient {
        if (!pcCache.has(chainId)) {
            const chain = extractSupportedChain(chainId);
            const pc = createPublicClient({
                chain,
                transport: http(`/api/proxy/rpc?id=${chainId}`),
            }) as PublicClient;
            pcCache.set(chainId, pc);
        }
        // Non-null; ensured above
        return pcCache.get(chainId)!;
    }

    function getWagmiChainId(): number {
        return getChainId(wagmiConfig);
    }

    function getWagmiAddress(): `0x${string}` {
        const address = getAccount(wagmiConfig).address;
        if (!address) throw new Error("Wallet account not found");
        return address;
    }

    return {
        getPublicClient,
        getWagmiAddress,
        getWagmiChainId,
        renegadeConfig,
        wagmiConfig,
        keychainNonce,
        permit: {},
    };
}
