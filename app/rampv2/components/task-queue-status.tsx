"use client";

import { ExternalLink } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTaskStateLabel } from "../helpers";
import type { TaskQueue } from "../queue/task-queue";
import { type CanonicalTaskState, STATUS_META, toCanonicalState } from "./task-status-meta";

interface TaskQueueStatusProps {
    queue: TaskQueue;
    onClose?: () => void;
}

// Snapshot of task progress information stored in a Map for O(1) updates.
interface TaskSnapshot {
    state: string; // raw state/label string from getTaskStateLabel
    label: string;
    url?: string;
}

// Display-ready structure used by the UI after derivation.
interface DisplayTask {
    id: string;
    name: string;
    label: string;
    url?: string;
    isActive: boolean;
    canonical: ReturnType<typeof toCanonicalState>;
}

export function TaskQueueStatus({ queue, onClose }: TaskQueueStatusProps) {
    // Map<taskId, TaskSnapshot>
    const [taskMap, setTaskMap] = React.useState<Map<string, TaskSnapshot>>(() => {
        const m = new Map<string, TaskSnapshot>();
        queue.tasks.forEach((t, idx) => {
            const id = (t as any).descriptor?.id ?? `task-${idx}`;
            const label = getTaskStateLabel(t);
            m.set(id, { label, state: label, url: t.explorerLink?.() });
        });
        return m;
    });

    // Queue-phase finite state: idle ➜ running ➜ (complete | error)
    const [queuePhase, setQueuePhase] = React.useState<"idle" | "running" | "complete" | "error">(
        "running",
    );
    const [queueErrorMsg, setQueueErrorMsg] = React.useState<string | null>(null);

    React.useEffect(() => {
        // --- task lifecycle listeners ---
        const onTaskUpdate = (task: any) => {
            const id = task?.descriptor?.id;
            if (!id) return;
            setTaskMap((prev) => {
                const next = new Map(prev);
                next.set(id, {
                    label: getTaskStateLabel(task),
                    state: getTaskStateLabel(task),
                    url: task.explorerLink?.(),
                });
                return next;
            });
        };

        const onTaskError = (task: any) => {
            const id = task?.descriptor?.id;
            if (!id) return;
            setTaskMap((prev) => {
                const next = new Map(prev);
                next.set(id, {
                    label: "Error",
                    state: "Error",
                    url: task.explorerLink?.(),
                });
                return next;
            });
        };

        const offUpdate = queue.events.on("taskUpdate", onTaskUpdate);
        const offComplete = queue.events.on("taskComplete", onTaskUpdate);
        const offTaskError = queue.events.on("taskError", onTaskError as any);

        // --- queue lifecycle listeners ---
        const offQueueComplete = queue.events.on("queueComplete", () => setQueuePhase("complete"));
        const offQueueError = queue.events.on("queueError", (err: unknown) => {
            // const message = err instanceof Error ? err.message : String(err);
            const message = (err as any).shortMessage ?? (err as any).message ?? String(err);
            setQueuePhase("error");
            setQueueErrorMsg(message);
        });

        return () => {
            offUpdate();
            offComplete();
            offTaskError();
            offQueueComplete();
            offQueueError();
        };
    }, [queue]);

    // Derive display-ready array in the original task order.
    const displayTasks: DisplayTask[] = React.useMemo(() => {
        const tasksArr: DisplayTask[] = [];
        queue.tasks.forEach((t, idx) => {
            const id = (t as any).descriptor?.id ?? `task-${idx}`;
            const snapshot = taskMap.get(id);
            const label = snapshot?.label ?? "Pending";
            const canonical = toCanonicalState(label);
            tasksArr.push({
                canonical,
                id,
                isActive: false,
                label,
                name: t.name(),
                url: snapshot?.url, // placeholder will adjust later
            });
        });

        // Determine active index (first non-terminal)
        const activeIdx = tasksArr.findIndex(
            (t) => t.canonical !== "Completed" && t.canonical !== "Error",
        );
        tasksArr.forEach((t, i) => {
            (t as any).isActive = activeIdx === -1 ? false : i === activeIdx;
        });
        return tasksArr;
    }, [queue.tasks, taskMap]);

    if (!displayTasks.length) return null;

    const canClose = queuePhase === "complete" || queuePhase === "error";

    // Presentational helpers are defined below module-level (after component).

    return (
        <div className="flex flex-col gap-6">
            <div className="flex-1 space-y-6 px-6 font-mono">
                {queuePhase === "error" && queueErrorMsg && (
                    <div className="text-destructive font-semibold break-words whitespace-pre-wrap">
                        {queueErrorMsg}, please try again.
                    </div>
                )}
                <ul className="border p-4 space-y-1">
                    {displayTasks.map((t) => (
                        <TaskRow canClose={canClose} key={t.id} t={t} />
                    ))}
                </ul>
            </div>

            {onClose && (
                <Button
                    className="w-full border-0 border-t font-extended text-2xl"
                    disabled={!canClose}
                    onClick={onClose}
                    size="xl"
                    variant="outline"
                >
                    Close
                </Button>
            )}
        </div>
    );
}

/* ---------- Presentational sub-components ---------- */

function TaskStatusIcon({ canonical }: { canonical: CanonicalTaskState }) {
    const meta = STATUS_META[canonical];
    if (!meta.icon) return <div className="min-w-4" />;
    const IconComp = meta.icon;
    return (
        <IconComp className={cn("h-4 w-4", meta.iconClass, meta.showSpinner && "animate-spin")} />
    );
}

function TaskRow({ t, canClose }: { t: DisplayTask; canClose: boolean }) {
    const textClass = t.isActive || canClose ? "text-primary" : "text-muted-foreground";

    return (
        <li className="space-y-1">
            <div className="flex items-center gap-2">
                <TaskStatusIcon canonical={t.canonical} />
                <span className={textClass}>{t.name}</span>
            </div>

            <div className={cn("flex items-center gap-1 ml-6", textClass)}>
                {t.label !== "Pending" && (
                    <span className="h-9 flex items-center">{`└─ ${t.label}`}</span>
                )}
                {t.url && (
                    <Button asChild className="text-primary" size="icon" variant="ghost">
                        <a
                            aria-label="Open in explorer"
                            href={t.url}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>
        </li>
    );
}
