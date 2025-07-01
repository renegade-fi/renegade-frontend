import type { Config as RenegadeConfig } from "@renegade-fi/react";
import { createPublicClient, http, type PublicClient, type WalletClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { extractSupportedChain } from "@/lib/viem";
import type { StepExecutionContext } from "./models";

// Factory to build a StepExecutionContext that supports multi-chain operations.
// Keeps client creation and wallet-chain switching logic in one place for clarity.

export function makeExecutionContext(
    baseWalletClient: WalletClient,
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

    async function getWalletClient(chainId: number): Promise<WalletClient> {
        if (baseWalletClient.chain?.id !== chainId) {
            await baseWalletClient.switchChain({ id: chainId });
        }
        return baseWalletClient;
    }

    return {
        getPublicClient,
        getWalletClient,
        renegadeConfig,
        wagmiConfig,
        keychainNonce,
        permit: {},
    };
}
