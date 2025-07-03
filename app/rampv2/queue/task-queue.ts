import type { Task } from "../core/task";
import { TaskDriver } from "../task-driver/task-driver";

/**
 * Minimal sequential queue that executes tasks in order using an internal
 * TaskDriver. No events/notifications for now – callers may await `run()`.
 */
export class TaskQueue {
    private readonly driver = new TaskDriver();

    constructor(private readonly tasks: Task[]) {}

    /** Executes all tasks sequentially. */
    async run(): Promise<void> {
        for (const t of this.tasks) {
            await this.driver.runTask(t);
        }
    }
}
