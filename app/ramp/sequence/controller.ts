import type { StoreApi } from "zustand";
import { buildSequence } from "./build-sequence";
import type { EvmStepRunner } from "./evm-step-runner";
import type { SequenceIntent, TxStep } from "./models";
import type { SequenceStore } from "./sequence-store";
import type { GetTokenMeta } from "./token-rules";
import { TransactionSequence } from "./transaction-sequence";

export type UpdateCallback = (steps: readonly TxStep[]) => void;

/**
 * Coordinates execution of a transaction sequence and persists it via zustand store.
 */
export class TransactionController {
    private sequence: TransactionSequence | null = null;
    private running = false;

    constructor(
        private readonly update: UpdateCallback,
        // zustand store api containing sequence & actions
        private readonly store: StoreApi<SequenceStore>,
        private readonly getTokenMeta: GetTokenMeta,
        private readonly runner: EvmStepRunner,
    ) {}

    start(intent: SequenceIntent): void {
        /* start */
        if (this.running) return;
        const steps = buildSequence(intent, this.getTokenMeta);
        this.sequence = new TransactionSequence(crypto.randomUUID(), steps);
        this.persist();
        this.emit();
        void this.runLoop();
    }

    resume(): void {
        /* resume */
        const existing = this.store.getState().sequence;
        if (this.running) return;
        if (existing) {
            this.sequence = existing;
            this.emit();
            void this.runLoop();
        }
    }

    // ---------- private helpers ----------

    private emit() {
        if (this.sequence) {
            this.update(this.sequence.all());
        }
    }

    private persist() {
        if (!this.sequence) return;
        // Clone to ensure a new object reference and avoid zustand shallow-equality short-circuit
        const clone = TransactionSequence.from(this.sequence.toJSON());
        /* persist */
        this.store.getState().setSequence(clone);
    }

    private async runLoop() {
        if (!this.sequence) return;
        this.running = true;
        try {
            let step = this.sequence.next();
            while (step) {
                // Mark waiting for user
                /* waiting */
                this.sequence.patch(step.id, { status: "WAITING_FOR_USER" });
                this.persist();
                this.emit();

                // Execute
                let updated: TxStep;
                try {
                    updated = await this.runner.run(step);
                    /* confirmed */
                } catch (err) {
                    console.error(err);
                    this.sequence.patch(step.id, { status: "FAILED" });
                    this.persist();
                    this.emit();
                    return; // stop on failure
                }

                // Persist success state
                this.sequence.patch(step.id, updated);
                this.persist();
                this.emit();

                // Next
                step = this.sequence.next();
            }
            // Done
            if (this.sequence.isComplete()) {
                /* complete */
            }
        } finally {
            this.running = false;
        }
    }

    /**
     * Manually clear the current sequence and store entry. UI can call after user dismisses results.
     */
    reset() {
        this.sequence = null;
        this.store.getState().clear();
        this.emit();
    }
}
