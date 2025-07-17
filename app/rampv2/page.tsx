"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";

import { Button } from "@/components/ui/button";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { cn } from "@/lib/utils";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";
import { TaskQueueStatus } from "./components/task-queue-status";
import BridgeForm from "./forms/bridge-form";
import DepositForm from "./forms/deposit-form";
import WithdrawForm from "./forms/withdraw-form";
import type { TaskQueue } from "./queue/task-queue";
import type { RampEnv } from "./types";

export default function RampV2Page() {
    // --- Shared context --- //
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const currentChain = useCurrentChain();

    const { address } = useAccount();

    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : null;

    const { data: keychainNonce } = useBackOfQueueWallet({
        query: { select: (w) => w.key_chain.nonce },
    });

    // --- Local state  --- //
    const [mode, setMode] = useState<"bridge" | "deposit" | "withdraw">("deposit");
    const [queue, setQueue] = useState<TaskQueue | null>(null);

    // --- Single guard --- //
    const evmAddress = address; // must exist to proceed

    const missingEssential = !renegadeConfig || !wagmiConfig || !evmAddress;

    if (missingEssential) {
        return (
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Ramp v2 Demo</h1>
                <p className="mt-4 text-muted-foreground">Connect your wallet to begin.</p>
            </main>
        );
    }

    // --- Build env --- //
    const env: RampEnv = {
        connection,
        currentChain,
        evmAddress: evmAddress as `0x${string}`,
        keychainNonce: keychainNonce ?? BigInt(0),
        renegadeConfig,
        solanaAddress,
        solanaSignTx: signTransaction ?? null, // may be null
        wagmiConfig,
    };

    function handleQueueStart(q: TaskQueue) {
        setQueue(q);
        q.run().catch(console.error);
    }

    return (
        <main>
            <section>
                {/* Mode toggle */}
                <div className="flex flex-row border-b border-border">
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "bridge" ? "text-primary" : "text-muted-foreground",
                        )}
                        onClick={() => setMode("bridge")}
                        size="xl"
                        variant="outline"
                    >
                        Bridge
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "deposit" ? "text-primary" : "text-muted-foreground",
                        )}
                        onClick={() => setMode("deposit")}
                        size="xl"
                        variant="outline"
                    >
                        Deposit
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "withdraw" ? "text-primary" : "text-muted-foreground",
                        )}
                        onClick={() => setMode("withdraw")}
                        size="xl"
                        variant="outline"
                    >
                        Withdraw
                    </Button>
                </div>

                {/* Render form or queue status */}
                {queue ? (
                    <TaskQueueStatus onClose={() => setQueue(null)} queue={queue} />
                ) : mode === "bridge" ? (
                    <BridgeForm env={env} onQueueStart={handleQueueStart} />
                ) : mode === "deposit" ? (
                    <DepositForm env={env} onQueueStart={handleQueueStart} />
                ) : (
                    <WithdrawForm env={env} onQueueStart={handleQueueStart} />
                )}
            </section>
        </main>
    );
}
