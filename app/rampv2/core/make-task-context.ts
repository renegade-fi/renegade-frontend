import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { Connection, VersionedTransaction } from "@solana/web3.js";
import { createPublicClient, http, type PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { getAccount } from "wagmi/actions";

import { extractSupportedChain, solana } from "@/lib/viem";
import type { TaskContext } from "./task-context";

// Solana signer type from wallet-adapter
type SolanaSigner = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

/**
 * Build a TaskContext for rampv2 tasks.
 */
export function makeTaskContext(
    renegadeConfig: RenegadeConfig,
    wagmiConfig: WagmiConfig,
    keychainNonce: bigint,
    connection: Connection | undefined,
    signTransaction: SolanaSigner | undefined,
    solanaAddress: string | undefined,
    balances: Record<string, bigint>,
): TaskContext {
    const pcCache = new Map<number, PublicClient>();
    const routeOutputs: Record<string, bigint> = {};

    function key(chain: number, tok: string) {
        return `${chain}-${tok.toLowerCase()}`;
    }

    function getPublicClient(chainId: number): PublicClient {
        if (!pcCache.has(chainId)) {
            const chain = extractSupportedChain(chainId);
            const pc = createPublicClient({
                chain,
                transport: http(`/api/proxy/rpc?id=${chainId}`),
            }) as PublicClient;
            pcCache.set(chainId, pc);
        }
        return pcCache.get(chainId)!;
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
        wagmiConfig,
        renegadeConfig,
        keychainNonce,
        permit: {},
        data: {},
        balances,
        routeOutputs,
        connection,
        signTransaction,

        /** ================= balance helpers ================= */
        routeOutput(chainId, token, delta) {
            const k = key(chainId, token);
            routeOutputs[k] = (routeOutputs[k] ?? BigInt(0)) + delta;
        },

        getWalletSnapshot(chainId, token) {
            const k = key(chainId, token);
            return balances[k] ?? BigInt(0);
        },

        getExpectedBalance(chainId, token) {
            const k = key(chainId, token);
            return (balances[k] ?? BigInt(0)) + (routeOutputs[k] ?? BigInt(0));
        },
    };
}
