import { queryOptions } from "@tanstack/react-query";
import type { Intent } from "../core/intent";
import type { TaskContext } from "../core/task-context";
import { planTasks } from "../planner/task-planner";

interface QueryParams {
    intent: Intent | undefined;
    taskCtx: TaskContext | undefined;
}

function queryKey(params: QueryParams) {
    return [
        "ramp",
        {
            intent: params.intent?.toJson(),
        },
    ];
}

export function planQueryOptions(params: QueryParams) {
    return queryOptions({
        queryKey: queryKey(params),
        queryFn: async () => {
            if (!params.intent || !params.taskCtx) return undefined;
            return planTasks(params.intent, params.taskCtx);
        },
        staleTime: 0,
        enabled: !!params.intent && !!params.taskCtx,
        refetchInterval: 5000,
    });
}
