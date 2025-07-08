import { type GetStatusRequest, getStatus } from "@lifi/sdk";
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

/** Poll LiFi backend until it returns a terminal status, suppressing all
 * errors during polling. After exhausting attempts, the latest error (if any)
 * is thrown; otherwise a timeout error is thrown.
 */
export async function waitForLiFiStatus(params: GetStatusRequest): Promise<LifiStatus> {
    const maxAttempts = 60; // 1 min @ 1s
    let attempts = 0;
    let lastError: unknown;

    while (attempts < maxAttempts) {
        try {
            const statusRes = await getStatus(params);
            if (["DONE", "FAILED", "INVALID"].includes(statusRes.status)) {
                return statusRes;
            }
        } catch (err) {
            // Store the latest encountered error but do not break the loop.
            lastError = err;
        }

        attempts++;
        await sleep(POLL_INTERVAL);
    }

    if (lastError) throw lastError;
    throw new Error("Failed to get status of transaction");
}
