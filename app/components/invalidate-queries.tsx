"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { globalRampEmitter } from "@/app/rampv2/global-ramp-events";

import { useTaskHistoryWebSocket } from "@/hooks/query/use-task-history-websocket";
import { shouldInvalidate } from "@/lib/query";

function invalidateQueries(queryClient: QueryClient) {
    queryClient.invalidateQueries({
        predicate: (query) => shouldInvalidate(query, queryClient),
    });
}

export function InvalidateQueries() {
    const queryClient = useQueryClient();
    useTaskHistoryWebSocket({
        onUpdate: (task) => {
            if (task.state === "Completed") {
                invalidateQueries(queryClient);
            }
        },
    });
    useEffect(() => {
        const offComplete = globalRampEmitter.on("taskComplete", () => {
            invalidateQueries(queryClient);
        });
        const offError = globalRampEmitter.on("queueError", () => {
            invalidateQueries(queryClient);
        });
        return () => {
            offComplete();
            offError();
        };
    }, [queryClient]);
    return null;
}
