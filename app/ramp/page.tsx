"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useConfig as useWagmiConfig } from "wagmi";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useConfig } from "@/providers/state-provider/hooks";
import { SequenceStoreProvider, useSequenceStoreApi } from "./storage/sequence-store-provider";
import { TransactionController } from "./transaction-control/controller";
import { ControllerProvider } from "./transaction-control/controller-context";
import { makeExecutionContext } from "./transaction-control/execution-context";
import { IntentForm } from "./ui/intent-form";
import { TransactionStepper } from "./ui/transaction-stepper";

export default function RampPage() {
    return (
        <SequenceStoreProvider>
            <RampSandbox />
        </SequenceStoreProvider>
    );
}

function RampSandbox() {
    const storeApi = useSequenceStoreApi();
    const config = useConfig();
    const wagmiConfig = useWagmiConfig();
    const { data: keychainNonce } = useBackOfQueueWallet({
        query: {
            select: (wallet) => wallet.key_chain.nonce,
        },
    });

    // Solana hooks
    const { connection } = useConnection();
    const { signTransaction, publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    const ready = Boolean(config);

    const contextValue = useMemo(() => {
        if (!ready) return null;
        const ctx = makeExecutionContext(
            config!,
            wagmiConfig,
            keychainNonce ?? BigInt(0),
            connection,
            signTransaction ?? undefined,
            solanaAddress,
        );
        const updateCb = (_steps: readonly any[]) => {
            /* no-op */
        };
        const c = new TransactionController(updateCb, storeApi, ctx);
        return { controller: c } as const;
    }, [
        ready,
        storeApi,
        config,
        keychainNonce,
        wagmiConfig,
        connection,
        signTransaction,
        solanaAddress,
    ]);

    if (!contextValue) {
        return (
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Transaction Ramp Sandbox</h1>
                <p className="mt-4 text-muted-foreground">
                    Connect your wallet to begin a deposit.
                </p>
            </main>
        );
    }

    return (
        <ControllerProvider value={contextValue}>
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Transaction Ramp Sandbox</h1>

                <section className="mt-6">
                    <IntentForm />
                </section>

                <TransactionStepper />
            </main>
        </ControllerProvider>
    );
}
