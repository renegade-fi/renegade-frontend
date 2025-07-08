import { getStatus } from "@lifi/sdk";
import type { Config as RenegadeConfig } from "@renegade-fi/react";
import { getTaskHistory, getTaskStatus } from "@renegade-fi/react/actions";

const POLL_INTERVAL = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* Polling helper */
async function pollUntil<T>(
    fn: () => Promise<T | undefined>,
    maxAttempts: number = Infinity,
): Promise<T> {
    let attempts = 0;
    while (attempts < maxAttempts) {
        const result = await fn();
        if (result !== undefined) return result;
        attempts++;
        await sleep(POLL_INTERVAL);
    }
    throw new Error("Polling timed out");
}

/** Poll Renegade backend until a task is completed or failed. */
export async function waitForRenegadeTask(cfg: RenegadeConfig, taskId: string): Promise<any> {
    const task = await pollUntil(async () => {
        try {
            // Primary strategy: poll the task status endpoint.
            const task = await getTaskStatus(cfg, { id: taskId });
            const state = task.state;
            if (state === "Completed") return task;
            if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
        } catch (_) {
            // Fallback: getTaskStatus failed (e.g. 404). Switch to polling the history map.
            const history = await getTaskHistory(cfg);
            const task = history?.get(taskId);
            if (task) {
                const state = task.state;
                if (state === "Completed") return task;
                if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
            }
        }
        return undefined;
    });
    return task;
}

type LifiStatus = Awaited<ReturnType<typeof getStatus>>;

/** Poll LiFi backend until it returns a terminal status. */
export async function waitForLiFiStatus(txHash: string): Promise<LifiStatus> {
    // Detect whether an error from the LiFi SDK indicates the transaction hash
    // has simply not propagated yet (HTTP 404 / NotFound) versus a fatal issue.
    const isNotFoundError = (e: unknown): boolean =>
        e instanceof Error &&
        (e.message?.includes("404") ||
            e.message?.toLowerCase().includes("notfound") ||
            e.message?.toLowerCase().includes("not found"));

    let attempts = 0;
    const maxAttempts = 300; // 5 min @ 1s
    let statusRes: LifiStatus | undefined;

    statusRes = await pollUntil(async () => {
        try {
            statusRes = await getStatus({ txHash });

            if (["DONE", "FAILED", "INVALID"].includes(statusRes.status)) {
                return statusRes;
            }
        } catch (err) {
            if (!isNotFoundError(err)) {
                // Bubble up non-transient errors immediately.
                throw err;
            }
            // Otherwise, treat as "status not yet available" and continue polling.
        }

        attempts++;
        return undefined;
    }, maxAttempts);

    return statusRes;
}
