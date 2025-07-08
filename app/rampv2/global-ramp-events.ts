import { createNanoEvents } from "nanoevents";
import type { Task } from "./core/task";

// Event bus for Ramp-wide events that UI may listen to.
interface GlobalRampEvents {
    taskComplete: (task: Task) => void;
    queueError: (error: unknown) => void;
}

export const globalRampEmitter = createNanoEvents<GlobalRampEvents>();
