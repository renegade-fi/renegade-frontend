"use client";

import { Check, ExternalLink, Loader2, X } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { getTaskStateLabel } from "../helpers";
import type { TaskQueue } from "../queue/task-queue";

interface TaskQueueStatusProps {
    queue: TaskQueue;
    onClose?: () => void;
}

interface TaskInfo {
    id: string;
    name: string;
    label: string;
    url?: string;
}

export function TaskQueueStatus({ queue, onClose }: TaskQueueStatusProps) {
    const [tasks, setTasks] = React.useState<TaskInfo[]>(() =>
        queue.tasks.map((t, idx) => ({
            id: (t as any).descriptor?.id ?? `task-${idx}`,
            name: t.name(),
            label: getTaskStateLabel(t),
            url: t.explorerLink?.(),
        })),
    );

    const [done, setDone] = React.useState(false);

    React.useEffect(() => {
        const update = (task: any) => {
            setTasks((prev) => {
                const id = task?.descriptor?.id;
                return prev.map((ti) =>
                    ti.id === id
                        ? { ...ti, label: getTaskStateLabel(task), url: task.explorerLink?.() }
                        : ti,
                );
            });
        };

        const offUpdate = queue.events.on("taskUpdate", update);
        const offComplete = queue.events.on("taskComplete", update);

        const offTaskError = queue.events.on("taskError", (task: any) => {
            setTasks((prev) => {
                const id = task?.descriptor?.id;
                return prev.map((ti) =>
                    ti.id === id ? { ...ti, label: "Error", url: task.explorerLink?.() } : ti,
                );
            });
        });

        const offQueueComplete = queue.events.on("queueComplete", () => setDone(true));
        const offQueueError = queue.events.on("queueError", () => setDone(true));

        return () => {
            offUpdate();
            offComplete();
            offTaskError();
            offQueueComplete();
            offQueueError();
        };
    }, [queue]);

    if (!tasks.length) return null;

    return (
        <div className="space-y-4 pt-6 font-mono">
            <ul className="space-y-1">
                {tasks.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-2">
                        {t.label === "Pending" && <div className="h-4 w-4 " />}
                        {t.label === "Completed" && <Check className="h-4 w-4 text-green-500" />}
                        {t.label === "Error" && <X className="h-4 w-4 text-red-500" />}
                        {t.label !== "Completed" &&
                            t.label !== "Error" &&
                            t.label !== "Pending" && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span className="text-muted-foreground">
                            {t.name}
                            {t.label === "Pending" ? "" : ` - ${t.label}`}
                        </span>
                        {t.url && (
                            <Button asChild size="icon" variant="ghost" className="text-primary">
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Open in explorer"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </li>
                ))}
            </ul>

            {onClose && (
                <Button
                    className="w-full border-0 border-t font-extended text-2xl"
                    size="xl"
                    variant="outline"
                    onClick={onClose}
                    disabled={!done}
                >
                    Close
                </Button>
            )}
        </div>
    );
}
