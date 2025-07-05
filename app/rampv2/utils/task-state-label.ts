import type { Task } from "../core/task";

/** Returns the task's current state as a displayable string. */
export function getTaskStateLabel(task: Task): string {
    return String(task.state());
}
