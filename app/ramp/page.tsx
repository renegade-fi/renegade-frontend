"use client";

import { useEffect, useMemo } from "react";
import { TransactionController } from "./sequence/controller";
import { EvmStepRunner } from "./sequence/evm-step-runner";
import type { SequenceIntent } from "./sequence/models";
import { SequenceStoreProvider, useSequenceStoreApi } from "./sequence/sequence-store-provider";
import { createTokenRules } from "./sequence/token-rules";
import { TransactionManager } from "./transaction-manager";

export default function RampPage() {
    return (
        <SequenceStoreProvider>
            <RampSandbox />
        </SequenceStoreProvider>
    );
}

function RampSandbox() {
    const storeApi = useSequenceStoreApi();

    // Build controller & deps once
    const controller = useMemo(() => {
        const rawTokens: any[] = [];
        const overlay = {
            TEST: {
                1: { deposit: true, withdraw: true },
            },
        } as const;

        const getTokenMeta = createTokenRules(rawTokens, overlay);
        const runner = new EvmStepRunner();
        const updateCb = () => {
            /* no-op */
        };
        return new TransactionController(updateCb, storeApi, getTokenMeta, runner);
    }, [storeApi]);

    useEffect(() => {
        controller.resume();
    }, [controller]);

    const handleStart = () => {
        const intent: SequenceIntent = {
            kind: "DEPOSIT",
            userAddress: "0x0000000000000000000000000000000000000000",
            fromChain: 1,
            toChain: 1,
            tokenSymbol: "TEST",
            amountAtomic: BigInt(1),
        };
        controller.start(intent);
    };

    return (
        <main className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Transaction Ramp Sandbox</h1>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleStart}>
                Start Dummy Deposit
            </button>

            <TransactionManager />
        </main>
    );
}
