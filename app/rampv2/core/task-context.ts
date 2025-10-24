import type { Config as RenegadeConfig } from "@renegade-fi/react";
import type { Connection, VersionedTransaction } from "@solana/web3.js";
import { createPublicClient, http, type PublicClient } from "viem";
import type { Config as WagmiConfig } from "wagmi";
import { getAccount } from "wagmi/actions";

import { extractSupportedChain, solana } from "@/lib/viem";

// Solana signer type from wallet-adapter
type SolanaSigner = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

/**
 * TaskContext is a lightweight, serialisable container for all runtime
 * dependencies required by rampv2 tasks.  It follows an idiomatic Rust style
 * where construction is done via a static `new` method rather than an external
 * factory function.
 */
export class TaskContext {
    /** wagmi client config used for EVM interactions */
    public readonly wagmiConfig: WagmiConfig;

    /** renegade client config used for darkpool tasks */
    public readonly renegadeConfig: RenegadeConfig;

    /** Keychain nonce for Renegade deposit witness */
    public readonly keychainNonce: bigint;

    /** Permit2 cache shared between tasks */
    private _permit: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }> = {};

    // Expose as getter/setter so tasks can both read and update while keeping
    // the underlying storage private.
    public get permit(): Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }> {
        return this._permit;
    }

    public set permit(value: Partial<{
        nonce: bigint;
        deadline: bigint;
        signature: `0x${string}`;
    }>) {
        this._permit = value;
    }

    /** Snapshot of the wallet balances supplied by the UI *before* any route executes */
    public readonly balances: Record<string, bigint>;

    /** Accumulated outputs produced by executed LI.FI routes */
    public readonly routeOutputs: Record<string, bigint> = {};

    /** Optional Solana RPC connection */
    public readonly connection?: Connection;

    /** Optional signer for Solana VersionedTransactions */
    public readonly signTransaction?: SolanaSigner;

    // ---------------------------------------------------------------------
    private readonly solanaAddress?: string;
    private readonly pcCache = new Map<number, PublicClient>();

    private constructor(
        renegadeConfig: RenegadeConfig,
        wagmiConfig: WagmiConfig,
        keychainNonce: bigint,
        connection: Connection | undefined,
        signTransaction: SolanaSigner | undefined,
        solanaAddress: string | undefined,
        balances: Record<string, bigint>,
    ) {
        this.renegadeConfig = renegadeConfig;
        this.wagmiConfig = wagmiConfig;
        this.keychainNonce = keychainNonce;
        this.connection = connection;
        this.signTransaction = signTransaction;
        this.solanaAddress = solanaAddress;
        this.balances = balances;
    }

    /**
     * Preferred constructor. Mirrors the original `makeTaskContext` signature
     * so existing call-sites only need to be updated from
     * `makeTaskContext(...)` to `TaskContext.new(...)`.
     */
    static new(
        renegadeConfig: RenegadeConfig,
        wagmiConfig: WagmiConfig,
        keychainNonce: bigint,
        connection: Connection | undefined,
        signTransaction: SolanaSigner | undefined,
        solanaAddress: string | undefined,
        balances: Record<string, bigint>,
    ): TaskContext {
        return new TaskContext(
            renegadeConfig,
            wagmiConfig,
            keychainNonce,
            connection,
            signTransaction,
            solanaAddress,
            balances,
        );
    }

    // ============================ Helpers ================================

    private key(chain: number, tok: string) {
        return `${chain}-${tok.toLowerCase()}`;
    }

    /** Obtain a viem PublicClient for the given chain id */
    getPublicClient(chainId: number): PublicClient {
        if (!this.pcCache.has(chainId)) {
            const chain = extractSupportedChain(chainId);
            const pc = createPublicClient({
                chain,
                transport: http(`/api/proxy/rpc?id=${chainId}`),
            }) as PublicClient;
            this.pcCache.set(chainId, pc);
        }
        return this.pcCache.get(chainId)!;
    }

    /** Chain-aware helper that returns the connected wallet address */
    getOnchainAddress(chainId: number): string {
        if (chainId === solana.id) {
            if (!this.solanaAddress) throw new Error("Solana wallet account not found");
            return this.solanaAddress;
        }
        const address = getAccount(this.wagmiConfig).address;
        if (!address) throw new Error("Wallet account not found");
        return address;
    }

    /** Convenience wrapper for EVM-only tasks */
    getEvmAddress(): `0x${string}` {
        const address = getAccount(this.wagmiConfig).address;
        if (!address) throw new Error("EVM wallet account not found");
        return address;
    }

    /** Register `delta` Wei of `token` on `chainId` coming from a completed LI.FI route */
    routeOutput(chainId: number, token: string, delta: bigint): void {
        const k = this.key(chainId, token);
        this.routeOutputs[k] = (this.routeOutputs[k] ?? BigInt(0)) + delta;
    }

    /** Wallet snapshot (pre-route execution); returns 0n if unknown */
    getWalletSnapshot(chainId: number, token: string): bigint {
        const k = this.key(chainId, token);
        return this.balances[k] ?? BigInt(0);
    }

    /** Wallet snapshot + accumulated route outputs */
    getExpectedBalance(chainId: number, token: string): bigint {
        const k = this.key(chainId, token);
        return (this.balances[k] ?? BigInt(0)) + (this.routeOutputs[k] ?? BigInt(0));
    }

    /**
     * Returns the correct amount for deposit/permit2 signing.
     * If route outputs exist (swap/bridge), use expected balance (wallet + route outputs).
     * Otherwise, use the descriptor amount (pure deposit).
     */
    getDepositAmount(chainId: number, token: string, descriptorAmount: bigint): bigint {
        const key = this.key(chainId, token);
        const hasRouteOutput = (this.routeOutputs[key] ?? BigInt(0)) > BigInt(0);
        return hasRouteOutput ? this.getExpectedBalance(chainId, token) : descriptorAmount;
    }
}
