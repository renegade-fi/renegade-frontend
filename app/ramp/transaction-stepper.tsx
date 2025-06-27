"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useControllerContext } from "./controller-context";
import type { TxStep } from "./sequence/models";
import { useSequenceStore } from "./sequence/sequence-store-provider";

function statusColor(status: TxStep["status"]): string {
    switch (status) {
        case "PENDING":
            return "text-gray-500";
        case "WAITING_FOR_USER":
            return "text-yellow-600";
        case "CONFIRMED":
            return "text-green-600";
        case "FAILED":
            return "text-red-600";
        default:
            return "text-blue-600";
    }
}

export function TransactionStepper() {
    const steps = useSequenceStore(useShallow((s) => s.sequence?.all() ?? []));
    const { runner, controller } = useControllerContext();

    // UI checkbox state mirrors runner.shouldFailNext
    const [failNext, setFailNext] = useState(false);

    function handleFailToggle(e: React.ChangeEvent<HTMLInputElement>) {
        const checked = e.target.checked;
        setFailNext(checked);
        runner.shouldFailNext = checked;
    }

    const formattedSteps = useMemo(() => steps, [steps]);

    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold">Transaction Steps</h2>
            {formattedSteps.length === 0 ? (
                <p className="text-sm text-gray-500 mt-2">No sequence running.</p>
            ) : (
                <table className="w-full mt-2 text-sm">
                    <thead>
                        <tr className="text-left text-xs text-gray-600">
                            <th className="py-1">Type</th>
                            <th className="py-1">Chain</th>
                            <th className="py-1">Token</th>
                            <th className="py-1">Amount</th>
                            <th className="py-1">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formattedSteps.map((s) => (
                            <tr key={s.id} className="border-t border-gray-200">
                                <td className="py-1 capitalize">{s.type.toLowerCase()}</td>
                                <td className="py-1">{s.chainId}</td>
                                <td className="py-1">{s.token.slice(0, 6)}…</td>
                                <td className="py-1">{s.amount.toString()}</td>
                                <td className={`py-1 font-medium ${statusColor(s.status)}`}>
                                    {s.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <details className="mt-4">
                <summary className="cursor-pointer select-none">Debug</summary>
                <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={failNext} onChange={handleFailToggle} />
                        Fail next step
                    </label>
                    <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => controller.reset()}
                    >
                        Clear Sequence
                    </button>
                    {/* <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(serialize(formattedSteps), null, 2)}
                    </pre> */}
                </div>
            </details>
        </section>
    );
}
