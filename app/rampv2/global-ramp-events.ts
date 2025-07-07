import { createNanoEvents } from "nanoevents";
import type { Task } from "./core/task";

// Event bus for Ramp-wide events that UI may listen to.
export interface GlobalRampEvents {
    taskComplete: (task: Task) => void;
}

export const globalRampEmitter = createNanoEvents<GlobalRampEvents>();
