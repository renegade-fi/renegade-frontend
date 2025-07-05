"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { TaskQueue } from "../queue/task-queue";
import { getTaskStateLabel } from "../utils/task-state-label";

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

        const offQueueComplete = queue.events.on("queueComplete", () => setDone(true));
        const offQueueError = queue.events.on("queueError", () => setDone(true));

        return () => {
            offUpdate();
            offComplete();
            offQueueComplete();
            offQueueError();
        };
    }, [queue]);

    if (!tasks.length) return null;

    return (
        <div className="space-y-4 pt-6">
            <ul className="space-y-1">
                {tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between text-sm">
                        <span>{t.name}</span>
                        <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t.label}</span>
                            {t.url && (
                                <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                >
                                    ↗
                                </a>
                            )}
                        </span>
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
