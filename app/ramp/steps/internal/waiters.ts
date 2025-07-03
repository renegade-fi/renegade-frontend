import { getStatus } from "@lifi/sdk";
import { getTaskStatus } from "@renegade-fi/react/actions";

// Helper aliases for return types – kept here to avoid re-importing SDK types elsewhere
export type RenegadeTask = Awaited<ReturnType<typeof getTaskStatus>>;
export type LifiStatus = Awaited<ReturnType<typeof getStatus>>;

/**
 * Poll Renegade backend until the task either completes or fails.
 */
export async function waitForRenegadeTask(cfg: any, taskId: string): Promise<RenegadeTask> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    while (true) {
        const task = await getTaskStatus(cfg, { id: taskId });
        const state = (task as any).state ?? (task as any).status;
        if (state === "Completed") return task;
        if (state === "Failed") throw new Error(`Renegade task ${taskId} failed`);
        await sleep(3000);
    }
}

/**
 * Await an on-chain transaction receipt via viem PublicClient.
 */
export async function waitForTxReceipt(publicClient: any, hash: string): Promise<void> {
    await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
}

/**
 * Poll LiFi backend until it returns a terminal status.
 */
export async function waitForLiFiStatus(txHash: string): Promise<LifiStatus> {
    let attempts = 0;
    const maxAttempts = 300; // 5 min at 1 s intervals
    let statusRes = await getStatus({ txHash });

    while (!["DONE", "FAILED", "INVALID"].includes(statusRes.status) && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        statusRes = await getStatus({ txHash });
        attempts++;
    }

    return statusRes;
}
