import { getTaskHistory, getTaskStatus } from "@renegade-fi/react/actions";
export async function waitForRenegadeTask(cfg: any, taskId: string): Promise<any> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
                await sleep(3000);
            }
        }
        await sleep(3000);
    }
}

/** Await an on-chain transaction receipt via viem PublicClient. */
export async function waitForTxReceipt(publicClient: any, hash: string): Promise<void> {
    await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
}

import { getStatus } from "@lifi/sdk";

export type LifiStatus = Awaited<ReturnType<typeof getStatus>>;

/** Poll LiFi backend until it returns a terminal status. */
export async function waitForLiFiStatus(txHash: string): Promise<LifiStatus> {
    let attempts = 0;
    const maxAttempts = 300; // 5 min @ 1s
    let statusRes = await getStatus({ txHash });
    while (!["DONE", "FAILED", "INVALID"].includes(statusRes.status) && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        statusRes = await getStatus({ txHash });
        attempts++;
    }
    return statusRes;
}
