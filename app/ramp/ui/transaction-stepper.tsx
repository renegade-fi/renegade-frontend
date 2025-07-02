"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useSequenceStore } from "../storage/sequence-store-provider";
import { useControllerContext } from "../transaction-control/controller-context";
import type { Step, StepWithDisplay } from "../types";

/**
 * Step with UI display information.
 * Our BaseStep implements both Step and StepDisplayInfo interfaces.
 */
function statusColor(status: Step["status"]): string {
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
    // Cast to StepWithDisplay since BaseStep implements both interfaces
    const steps = useSequenceStore(useShallow((s) => s.sequence?.all() ?? [])) as StepWithDisplay[];
    const { controller } = useControllerContext();

    // Apply cognitive load reduction - meaningful intermediate for UI formatting
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
                            <TableHead>Details</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Chain</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formattedSteps.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="capitalize">{s.name}</TableCell>
                                <TableCell>{s.details}</TableCell>
                                <TableCell className={`${statusColor(s.status)} font-medium`}>
                                    {s.status}
                                </TableCell>
                                <TableCell>{s.chain}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="mt-4">
                <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-xs"
                    onClick={() => controller.reset()}
                >
                    Clear Sequence
                </Button>
            </div>
        </section>
    );
}
