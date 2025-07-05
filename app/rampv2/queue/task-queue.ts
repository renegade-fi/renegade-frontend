import type { Emitter } from "nanoevents";
import { createNanoEvents } from "nanoevents";
import type { Task } from "../core/task";
import { TaskDriver, type TaskDriverEvents } from "../driver/task-driver";

type TaskQueueEvents = TaskDriverEvents & {
    queueStart: () => void;
    queueComplete: () => void;
    queueError: (error: unknown) => void;
};

/**
 * Minimal sequential queue that executes tasks in order using an internal
 * TaskDriver. No events/notifications for now – callers may await `run()`.
 */
export class TaskQueue {
    public readonly events: Emitter<TaskQueueEvents>;
    private readonly driver: TaskDriver;

    constructor(private readonly _tasks: Task[]) {
        this.events = createNanoEvents<TaskQueueEvents>();
        // Pass the same emitter to the driver with appropriate narrowing
        this.driver = new TaskDriver(this.events as unknown as Emitter<TaskDriverEvents>);
    }

    /** Read-only access to underlying tasks */
    get tasks(): readonly Task[] {
        return this._tasks;
    }

    /** Executes all tasks sequentially. */
    async run(): Promise<void> {
        try {
            this.events.emit("queueStart");
            for (const t of this._tasks) {
                await this.driver.runTask(t);
            }
            this.events.emit("queueComplete");
        } catch (err) {
            this.events.emit("queueError", err);
            throw err;
        }
    }
}
