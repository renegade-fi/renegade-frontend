import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { Connection } from "@solana/web3.js";
import type { PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";

/**
 * Runtime dependencies injected into each Task upon construction.  The context
 * deliberately avoids anything unserialisable or heavy so that tasks remain
 * lightweight POJOs when persisted.
 */
export interface TaskContext {
    /** wagmi client config used for EVM interactions */
    wagmiConfig: WagmiConfig;

    /** renegade client config used for darkpool tasks */
    renegadeConfig: RenegadeConfig;

    /** Helper to obtain an RPC client for an arbitrary chain id */
    getPublicClient(chainId: number): PublicClient;

    /** Solana RPC connection; provided only for Solana-chain tasks */
    connection?: Connection;

    getOnchainAddress(chainId: number): string;

    /** EVM-only helper to get the connected wallet address */
    getEvmAddress(): `0x${string}`;

    /** Keychain nonce for Renegade deposit witness */
    keychainNonce: bigint;

    /** Permit2 cache shared between tasks */
    permit: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }>;

    /** Scratch space for lightweight hand-offs (e.g., LiFi final amount) */
    data: {
        lifiFinalAmount?: bigint;
    };

    /** Optional signer function for Solana VersionedTransactions */
    signTransaction?: (
        tx: import("@solana/web3.js").VersionedTransaction,
    ) => Promise<import("@solana/web3.js").VersionedTransaction>;
}
