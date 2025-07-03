import type { Task, TaskError } from "../core/task";

/**
 * Minimal synchronous driver that simply advances a Task until its `completed`
 * flag flips.  It purposefully skips retries, back-off, queueing, and
 * notifications; those features can be layered on later.
 */
export class TaskDriver {
    /** Execute the given task to completion. */
    async runTask<T extends Task<any, any, TaskError>>(task: T): Promise<void> {
        try {
            while (!task.completed()) {
                await task.step();
                // Yield back to the event loop to avoid starvation in tight loops.
                await Promise.resolve();
            }
            await task.cleanup?.(true);
        } catch (err) {
            await task.cleanup?.(false);
            // Propagate failure so that the queue aborts on the first task failure.
            throw err;
        }
    }
}
