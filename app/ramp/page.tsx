"use client";

import { useEffect, useMemo } from "react";
import { ControllerProvider } from "./controller-context";
import { IntentForm } from "./intent-form";
import { TransactionController } from "./sequence/controller";
import { EvmStepRunner } from "./sequence/evm-step-runner";
import { SequenceStoreProvider, useSequenceStoreApi } from "./sequence/sequence-store-provider";
import { getTokenMeta } from "./sequence/token-registry";
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

    // Build controller/runners once
    const { controller, runner } = useMemo(() => {
        const r = new EvmStepRunner();
        const updateCb = () => {
            /* no-op */
        };
        const c = new TransactionController(updateCb, storeApi, getTokenMeta, r);
        return { controller: c, runner: r };
    }, [storeApi]);

    useEffect(() => {
        controller.resume();
        // we intentionally depend only on controller
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controller]);

    return (
        <ControllerProvider value={{ controller, runner }}>
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
