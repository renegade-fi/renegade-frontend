"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { globalRampEmitter } from "@/app/rampv2/global-ramp-events";

import { useTaskHistoryWebSocket } from "@/hooks/query/use-task-history-websocket";
import { shouldInvalidate } from "@/lib/query";

export function InvalidateQueries() {
    const queryClient = useQueryClient();
    useTaskHistoryWebSocket({
        onUpdate: (task) => {
            if (task.state === "Completed") {
                queryClient.invalidateQueries({
                    predicate: (query) => shouldInvalidate(query, queryClient),
                });
            }
        },
    });
    useEffect(() => {
        const off = globalRampEmitter.on("taskComplete", () => {
            queryClient.invalidateQueries({
                predicate: (query) => shouldInvalidate(query, queryClient),
            });
        });
        return off;
    }, [queryClient]);
    return null;
}
