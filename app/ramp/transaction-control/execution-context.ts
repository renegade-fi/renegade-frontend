import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { Connection, VersionedTransaction } from "@solana/web3.js";
import { createPublicClient, http, type PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { getAccount, getChainId } from "wagmi/actions";
import { extractSupportedChain, solana } from "@/lib/viem";
import type { StepExecutionContext } from "../types";

// Solana signer type from wallet-adapter
type SolanaSigner = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

/**
 * Create an execution context for multi-chain transaction steps.
 *
 * Provides memoized chain clients and wallet access methods.
 */
export function makeExecutionContext(
    renegadeConfig: RenegadeConfig,
    wagmiConfig: WagmiConfig,
    keychainNonce: bigint,
    connection?: Connection,
    signTransaction?: SolanaSigner,
    solanaAddress?: string,
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

    function getOnchainAddress(chainId: number): string {
        if (chainId === solana.id) {
            if (!solanaAddress) throw new Error("Solana wallet account not found");
            return solanaAddress;
        }
        const address = getAccount(wagmiConfig).address;
        if (!address) throw new Error("Wallet account not found");
        return address;
    }

    function getEvmAddress(): `0x${string}` {
        const address = getAccount(wagmiConfig).address;
        if (!address) throw new Error("EVM wallet account not found");
        return address;
    }

    return {
        getPublicClient,
        getOnchainAddress,
        getEvmAddress,
        getWagmiChainId,
        renegadeConfig,
        wagmiConfig,
        keychainNonce,
        permit: {},
        data: {},
        connection,
        signTransaction,
    };
}
