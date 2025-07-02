import { ApproveStep } from "../../steps/approve-step";
import { DepositStep } from "../../steps/deposit-step";
import { Permit2Step } from "../../steps/internal/permit2-step";
import { LiFiLegStep } from "../../steps/lifi-leg-step";
import { PayFeesStep } from "../../steps/pay-fees-step";
import { WithdrawStep } from "../../steps/withdraw-step";
import type { Step } from "../../types";

function reviveStep(data: any): Step {
    const type: string = data.type;
    const chainId: number = data.chainId;
    const mint = data.mint as `0x${string}`;
    const amount = BigInt(data.amount);

    let step: Step;
    switch (type) {
        case "LIFI_LEG":
            step = new LiFiLegStep(data.leg) as Step;
            break;
        case "APPROVE":
            step = new ApproveStep(chainId, mint, amount, data.spender as `0x${string}`) as Step;
            break;
        case "PERMIT2_SIG":
            step = new Permit2Step(chainId, mint, amount) as Step;
            break;
        case "DEPOSIT":
            step = new DepositStep(chainId, mint, amount) as Step;
            break;
        case "WITHDRAW":
            step = new WithdrawStep(chainId, mint, amount) as Step;
            break;
        case "PAY_FEES":
            step = new PayFeesStep(chainId) as Step;
            break;
        default:
            throw new Error(`Unknown step type ${type}`);
    }

    // Restore metadata
    Object.assign(step, {
        id: data.id,
        status: data.status,
        txHash: data.txHash,
        taskId: data.taskId,
    });

    return step;
}

/**
 * @internal
 * Manages an ordered sequence of transaction steps.
 *
 * Provides methods for step traversal, updates, and serialization.
 */
export class TransactionSequence {
    constructor(
        public readonly id: string,
        private steps: Step[],
    ) {}

    /** Get all steps in the sequence. */
    all(): readonly Step[] {
        return [...this.steps];
    }

    /** Get the next step that needs execution. */
    next(): Step | undefined {
        return this.steps.find((s) =>
            ["PENDING", "WAITING_FOR_USER", "SUBMITTED", "CONFIRMING"].includes(s.status),
        );
    }

    /** Update a step by ID with partial fields. */
    patch(stepId: string, fields: Partial<Step>): Step {
        const idx = this.steps.findIndex((s) => s.id === stepId);
        if (idx === -1) throw new Error(`Step ${stepId} not found`);
        const updated = Object.assign(this.steps[idx], fields);
        this.steps[idx] = updated;
        return updated;
    }

    /** Check if all steps are confirmed. */
    isComplete(): boolean {
        return this.steps.every((s) => s.status === "CONFIRMED");
    }

    /** Serialize to JSON for persistence. */
    toJSON(): unknown {
        return {
            id: this.id,
            steps: this.steps.map((s) => (s as any).toJSON()),
        };
    }

    /** Deserialize from JSON to reconstruct sequence. */
    static from(raw: any): TransactionSequence {
        const revivedSteps: Step[] = (raw.steps as any[]).map(reviveStep);
        return new TransactionSequence(raw.id, revivedSteps);
    }
}
