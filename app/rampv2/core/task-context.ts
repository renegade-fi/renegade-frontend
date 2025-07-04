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

    /** Scratch space for miscellaneous task-to-task hand-offs. Intentionally
     * untyped so that individual tasks can store throw-away values without
     * forcing a shared schema. */
    data: Record<string, unknown>;

    /**
     * Snapshot of the wallet balances supplied by the UI *before* any route
     * executes. Keys follow `balanceKey(chainId, token)`.
     */
    balances: Record<string, bigint>;

    /**
     * Accumulated outputs produced by executed LI.FI routes. Keys follow the
     * same convention as `balances`.
     */
    routeOutputs: Record<string, bigint>;

    /**
     * Add `delta` Wei of `token` on `chainId` coming from a completed LI.FI
     * route (swap or bridge).
     */
    routeOutput(chainId: number, token: string, delta: bigint): void;

    /** Return the wallet snapshot the UI passed in; 0n if unknown. */
    getWalletSnapshot(chainId: number, token: string): bigint;

    /** Return wallet snapshot + accumulated route outputs. */
    getExpectedBalance(chainId: number, token: string): bigint;

    /** Optional signer function for Solana VersionedTransactions */
    signTransaction?: (
        tx: import("@solana/web3.js").VersionedTransaction,
    ) => Promise<import("@solana/web3.js").VersionedTransaction>;
}
