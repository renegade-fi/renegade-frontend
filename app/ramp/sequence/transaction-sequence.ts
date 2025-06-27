import type { TxStep } from "./models";

export class TransactionSequence {
    constructor(
        public readonly id: string,
        private steps: TxStep[],
    ) {}

    all(): readonly TxStep[] {
        return [...this.steps];
    }

    next(): TxStep | undefined {
        return this.steps.find((s) =>
            ["PENDING", "WAITING_FOR_USER", "SUBMITTED", "CONFIRMING"].includes(s.status),
        );
    }

    patch(stepId: string, fields: Partial<TxStep>): TxStep {
        const idx = this.steps.findIndex((s) => s.id === stepId);
        if (idx === -1) throw new Error(`Step ${stepId} not found`);
        const updated = { ...this.steps[idx], ...fields } as TxStep;
        this.steps[idx] = updated;
        return updated;
    }

    isComplete(): boolean {
        return this.steps.every((s) => s.status === "CONFIRMED");
    }

    toJSON(): unknown {
        return {
            id: this.id,
            steps: this.steps,
        };
    }

    static from(raw: any): TransactionSequence {
        return new TransactionSequence(raw.id, raw.steps as TxStep[]);
    }
}
