import { getStatus } from "@lifi/sdk";
import { getTaskHistory, getTaskStatus } from "@renegade-fi/react/actions";
import type { PublicClient } from "viem";

const POLL_INTERVAL = 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function waitForRenegadeTask(cfg: any, taskId: string): Promise<any> {
    while (true) {
        try {
            // Primary strategy: poll the task status endpoint.
            const task = await getTaskStatus(cfg, { id: taskId });
            const state = task.state;
            if (state === "Completed") return task;
            if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
        } catch (_) {
            // Fallback: getTaskStatus failed (e.g. 404). Switch to polling the history map.
            while (true) {
                const history = await getTaskHistory(cfg);
                const task = history?.get(taskId);
                if (task) {
                    const state = task.state;
                    if (state === "Completed") return task;
                    if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
                }
                await sleep(POLL_INTERVAL);
            }
        }
        await sleep(POLL_INTERVAL);
    }
}

/** Await an on-chain transaction receipt via viem PublicClient. */
export async function waitForTxReceipt(
    publicClient: PublicClient,
    hash: `0x${string}`,
): Promise<void> {
    await publicClient.waitForTransactionReceipt({ hash });
}

export type LifiStatus = Awaited<ReturnType<typeof getStatus>>;

/** Poll LiFi backend until it returns a terminal status. */
export async function waitForLiFiStatus(txHash: string): Promise<LifiStatus> {
    let attempts = 0;
    const maxAttempts = 300; // 5 min @ 1s
    let statusRes = await getStatus({ txHash });
    while (!["DONE", "FAILED", "INVALID"].includes(statusRes.status) && attempts < maxAttempts) {
        await sleep(POLL_INTERVAL);
        statusRes = await getStatus({ txHash });
        attempts++;
    }
    return statusRes;
}
