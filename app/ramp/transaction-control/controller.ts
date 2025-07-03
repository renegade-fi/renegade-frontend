import type { StoreApi } from "zustand";
import { buildSequence } from "../sequence-builder";
import type { SequenceStore } from "../storage";
import { SequenceIntent, type Step, type StepExecutionContext, type StepStatus } from "../types";
import { TransactionSequence } from "./internal/transaction-sequence";

/** Callback for step updates. */
export type UpdateCallback = (steps: readonly Step[]) => void;

/**
 * Result of step execution
 * Cognitive Load: meaningful intermediates
 */
interface StepResult {
    success: boolean;
    error?: Error;
}

/**
 * Validation result for preconditions
 * Control Flow: push ifs up
 */
interface ValidationResult {
    valid: boolean;
    reason?: string;
}

/**
 * Coordinates execution of transaction sequences with persistence.
 *
 * Manages step execution, state updates, and error handling for
 * multi-step transaction flows.
 */
export class TransactionController {
    private sequence: TransactionSequence | null = null;
    private running = false;

    constructor(
        private readonly update: UpdateCallback,
        // zustand store api containing sequence & actions
        private readonly store: StoreApi<SequenceStore>,
        private readonly ctx: StepExecutionContext,
    ) {}

    /**
     * Start a new transaction sequence from an intent.
     */
    async start(intentRaw: SequenceIntent): Promise<void> {
        const validation = this.canStart();
        if (!validation.valid) {
            console.warn(`Cannot start sequence: ${validation.reason}`);
            return;
        }

        const intent = SequenceIntent.from(intentRaw);
        const steps = await buildSequence(intent, this.ctx);
        console.log("🚀 ~ TransactionController ~ start ~ steps:", steps);
        this.sequence = new TransactionSequence(crypto.randomUUID(), steps);
        this.updateSequenceState();
        void this.runLoop();
    }

    /**
     * Resume a persisted sequence from storage.
     */
    resume(): void {
        const validation = this.canResume();
        if (!validation.valid) {
            console.warn(`Cannot resume sequence: ${validation.reason}`);
            return;
        }

        const existing = this.store.getState().sequence;
        this.sequence = existing!;
        this.updateSequenceState();
        void this.runLoop();
    }

    /**
     * Clear the current sequence and reset state.
     */
    reset() {
        this.sequence = null;
        this.store.getState().clear();
        this.emit();
    }

    // ---------- State Management ----------
    // Cognitive Load: minimize extraneous load by consolidating state updates

    private updateSequenceState(status?: StepStatus, stepId?: string): void {
        if (stepId && status) {
            this.sequence?.patch(stepId, { status });
        }
        this.persist();
        this.emit();
    }

    private emit() {
        if (this.sequence) {
            this.update(this.sequence.all());
        }
    }

    private persist() {
        if (!this.sequence) return;
        // Clone to ensure a new object reference and avoid zustand shallow-equality short-circuit
        const clone = TransactionSequence.from(this.sequence.toJSON());
        this.store.getState().setSequence(clone);
    }

    // ---------- Validation ----------
    // Control Flow: push ifs up

    private canStart(): ValidationResult {
        if (this.running) {
            return { valid: false, reason: "Sequence already running" };
        }
        return { valid: true };
    }

    private canResume(): ValidationResult {
        if (this.running) {
            return { valid: false, reason: "Sequence already running" };
        }
        const existing = this.store.getState().sequence;
        if (!existing) {
            return { valid: false, reason: "No sequence to resume" };
        }
        return { valid: true };
    }

    // ---------- Execution Logic ----------
    // Cognitive Load: deep modules with simple interfaces

    private async runLoop() {
        if (!this.sequence) return;

        this.running = true;
        try {
            await this.executeAllSteps();
        } finally {
            this.running = false;
        }
    }

    private async executeAllSteps(): Promise<void> {
        let step = this.sequence!.next();

        while (step) {
            const result = await this.executeStep(step);

            if (!result.success) {
                this.handleStepFailure(step, result.error!);
                return; // stop on failure
            }

            this.handleStepSuccess(step);
            step = this.sequence!.next();
        }

        if (this.sequence!.isComplete()) {
            // Sequence is complete, no additional state update needed
        }
    }

    private async executeStep(step: Step): Promise<StepResult> {
        this.updateSequenceState("WAITING_FOR_USER", step.id);

        try {
            await step.run(this.ctx);
            return { success: true };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    private handleStepSuccess(step: Step): void {
        // Step has mutated itself during run
        this.sequence!.patch(step.id, {});
        this.persist();
        this.emit();
    }

    private handleStepFailure(step: Step, error: Error): void {
        this.updateSequenceState("FAILED", step.id);
    }
}
