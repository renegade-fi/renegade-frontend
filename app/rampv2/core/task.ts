export interface TaskError extends Error {
    /**
     * Indicates whether the task can be safely retried when this error is
     * encountered. The minimal executor shipped with rampv2 ignores this flag for
     * now, but future versions will respect it for back-off logic.
     */
    retryable(): boolean;
}

/**
 * Generic asynchronous state-machine contract.
 *
 * @typeParam D   Serialisable descriptor that captures the task intent. Should
 *                contain only data, no functions.
 * @typeParam S   Enumerated state union that expresses progress.  Each call to
 *                {@link Task.step} must advance the state by **at most** one
 *                variant.
 * @typeParam E   Error type emitted by the task.  Must implement
 *                {@link TaskError} so the executor can decide whether to
 *                retry.
 */
export interface Task<D = unknown, S = unknown, E extends TaskError = TaskError> {
    /** Serialisable description of the task. Useful for persistence & logging. */
    readonly descriptor: D;

    /** Human-readable name for dashboards, logs, etc. */
    name(): string;

    /** Current state-machine variant. */
    state(): S;

    /** Convenience: `state() === completedState` */
    completed(): boolean;

    /**
     * Advance the internal state by **at most** one transition.  Must never loop
     * internally; the executor is responsible for repeated invocations.
     */
    step(): Promise<void>;

    /** Optional finaliser invoked exactly once after success or fatal failure. */
    cleanup?(success: boolean): Promise<void>;
}
