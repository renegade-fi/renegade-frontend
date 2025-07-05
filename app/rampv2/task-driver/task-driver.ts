import type { Emitter } from "nanoevents";
import type { Task, TaskError } from "../core/task";

// Event payload typing for nanoevents
export interface TaskDriverEvents {
    taskStart: (task: Task) => void;
    taskUpdate: (task: Task) => void;
    taskComplete: (task: Task) => void;
    taskError: (task: Task, error: unknown) => void;
}

// Helper alias for optional emitter
type TaskDriverEmitter = Emitter<TaskDriverEvents> | undefined;

/**
 * Minimal synchronous driver that simply advances a Task until its `completed`
 * flag flips.  It purposefully skips retries, back-off, queueing, and
 * notifications; those features can be layered on later.
 */
export class TaskDriver {
    constructor(private readonly events?: TaskDriverEmitter) {}

    /** Execute the given task to completion. */
    async runTask<T extends Task<any, any, TaskError>>(task: T): Promise<void> {
        this.events?.emit("taskStart", task);
        try {
            while (!task.completed()) {
                await task.step();
                // Notify listeners after each successful step.
                this.events?.emit("taskUpdate", task);
                // Yield back to the event loop to avoid starvation in tight loops.
                await Promise.resolve();
            }
            this.events?.emit("taskComplete", task);
            await task.cleanup?.(true);
        } catch (err) {
            this.events?.emit("taskError", task, err);
            await task.cleanup?.(false);
            // Propagate failure so that the queue aborts on the first task failure.
            throw err;
        }
    }
}
