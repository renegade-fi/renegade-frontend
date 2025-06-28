"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useControllerContext } from "./controller-context";
import type { TxStep } from "./sequence/models";
import { useSequenceStore } from "./sequence/sequence-store-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";

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

    function handleFailToggle(checked: boolean) {
        setFailNext(checked);
        runner.shouldFailNext = checked;
    }

    const formattedSteps = useMemo(() => steps, [steps]);

    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold">Transaction Steps</h2>
            {formattedSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">No sequence running.</p>
            ) : (
                <Table className="w-full mt-2 text-sm">
                    <TableHeader>
                        <TableRow className="text-xs text-muted-foreground">
                            <TableHead>Type</TableHead>
                            <TableHead>Chain</TableHead>
                            <TableHead>Token</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formattedSteps.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="capitalize">{s.type.toLowerCase()}</TableCell>
                                <TableCell>{s.chainId}</TableCell>
                                <TableCell>{s.mint.slice(0, 6)}…</TableCell>
                                <TableCell>{s.amount.toString()}</TableCell>
                                <TableCell className={`${statusColor(s.status)} font-medium`}>
                                    {s.status}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <details className="mt-4">
                <summary className="cursor-pointer select-none">Debug</summary>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        <Checkbox
                            id="fail-next"
                            checked={failNext}
                            onCheckedChange={(c) => handleFailToggle(Boolean(c))}
                        />
                        <Label htmlFor="fail-next" className="text-xs">
                            Fail next step
                        </Label>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-xs"
                        onClick={() => controller.reset()}
                    >
                        Clear Sequence
                    </Button>
                    {/* <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(serialize(formattedSteps), null, 2)}
                    </pre> */}
                </div>
            </details>
        </section>
    );
}
