"use client";

import { useShallow } from "zustand/react/shallow";
import type { TxStep } from "./sequence/models";
import { useSequenceStore } from "./sequence/sequence-store-provider";

export function TransactionManager() {
    const steps = useSequenceStore(
        useShallow((s) => (s.sequence ? s.sequence.all() : [])),
    ) as readonly TxStep[];

    return (
        <div className="space-y-2 mt-4">
            <h2 className="text-lg font-semibold">Sequence Steps</h2>
            {steps.length === 0 ? (
                <p>No steps yet.</p>
            ) : (
                <ul className="list-disc pl-6">
                    {steps.map((s) => (
                        <li key={s.id}>
                            {s.type} – {s.status}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
