import type { Emitter } from "nanoevents";
import type { Task, TaskError } from "../core/task";
import { globalRampEmitter } from "../global-ramp-events";

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

    /** Centralized event emission (local and global) */
    private emit<E extends keyof TaskDriverEvents>(
        event: E,
        ...args: Parameters<TaskDriverEvents[E]>
    ) {
        // Emit to local listeners if present
        this.events?.emit(event, ...(args as any));
        // Propagate task completion globally for React-Query invalidation
        if (event === "taskComplete") {
            const [task] = args as [Task];
            globalRampEmitter.emit("taskComplete", task);
        }
    }

    /** Execute the given task to completion. */
    async runTask<T extends Task<any, any, TaskError>>(task: T): Promise<void> {
        this.emit("taskStart", task);
        try {
            while (!task.completed()) {
                await task.step();
                // Notify listeners after each successful step.
                this.emit("taskUpdate", task);
                // Yield back to the event loop to avoid starvation in tight loops.
                await Promise.resolve();
            }
            this.emit("taskComplete", task);
            await task.cleanup?.(true);
        } catch (err) {
            this.emit("taskError", task, err);
            await task.cleanup?.(false);
            // Propagate failure so that the queue aborts on the first task failure.
            throw err;
        }
    }
}
