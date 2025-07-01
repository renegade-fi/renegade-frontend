"use client";

import { useEffect, useMemo } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useConfig } from "@/providers/state-provider/hooks";
import { ControllerProvider } from "./controller-context";
import { IntentForm } from "./intent-form";
import { TransactionController } from "./sequence/controller";
import type { StepExecutionContext } from "./sequence/models";
import { SequenceStoreProvider, useSequenceStoreApi } from "./sequence/sequence-store-provider";
import { TransactionStepper } from "./transaction-stepper";

export default function RampPage() {
    return (
        <SequenceStoreProvider>
            <RampSandbox />
        </SequenceStoreProvider>
    );
}

function RampSandbox() {
    const storeApi = useSequenceStoreApi();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const config = useConfig();
    const { data: keychainNonce } = useBackOfQueueWallet({
        query: {
            select: (wallet) => wallet.key_chain.nonce,
        },
    });

    const ready = Boolean(walletClient && publicClient && config);

    // Build controller; may be null if not ready
    const contextValue = useMemo(() => {
        if (!ready) return null;
        const ctx: StepExecutionContext = {
            walletClient: walletClient!,
            publicClient: publicClient!,
            renegadeConfig: config!,
            keychainNonce: keychainNonce ?? BigInt(0),
            permit: {},
        };
        const updateCb = (_steps: readonly any[]) => {
            /* no-op */
        };
        const c = new TransactionController(updateCb, storeApi, ctx);
        return { controller: c } as const;
    }, [ready, storeApi, walletClient, publicClient, config, keychainNonce]);

    // Resume any persisted sequence once controller exists
    useEffect(() => {
        if (contextValue) {
            contextValue.controller.resume();
        }
    }, [contextValue]);

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
