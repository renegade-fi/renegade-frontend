import type { Step } from "./models";
import { ApproveStep } from "./steps/approve-step";
import { BridgeTxStep } from "./steps/bridge-tx-step";
import { DepositTxStep } from "./steps/deposit-tx-step";
import { Permit2SigStep } from "./steps/permit2-sig-step";
import { WithdrawTxStep } from "./steps/withdraw-tx-step";

function reviveStep(data: any): Step {
    const type: string = data.type;
    const chainId: number = data.chainId;
    const mint = data.mint as `0x${string}`;
    const amount = BigInt(data.amount);

    let step: Step;
    switch (type) {
        case "BRIDGE":
            step = new BridgeTxStep(chainId, mint, amount) as Step;
            break;
        case "APPROVE":
            step = new ApproveStep(chainId, mint, amount, data.spender as `0x${string}`) as Step;
            break;
        case "PERMIT2_SIG":
            step = new Permit2SigStep(chainId, mint, amount) as Step;
            break;
        case "DEPOSIT":
            step = new DepositTxStep(chainId, mint, amount) as Step;
            break;
        case "WITHDRAW":
            step = new WithdrawTxStep(chainId, mint, amount) as Step;
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

export class TransactionSequence {
    constructor(
        public readonly id: string,
        private steps: Step[],
    ) {}

    all(): readonly Step[] {
        return [...this.steps];
    }

    next(): Step | undefined {
        return this.steps.find((s) =>
            ["PENDING", "WAITING_FOR_USER", "SUBMITTED", "CONFIRMING"].includes(s.status),
        );
    }

    patch(stepId: string, fields: Partial<Step>): Step {
        const idx = this.steps.findIndex((s) => s.id === stepId);
        if (idx === -1) throw new Error(`Step ${stepId} not found`);
        const updated = Object.assign(this.steps[idx], fields);
        this.steps[idx] = updated;
        return updated;
    }

    isComplete(): boolean {
        return this.steps.every((s) => s.status === "CONFIRMED");
    }

    toJSON(): unknown {
        return {
            id: this.id,
            steps: this.steps.map((s) => (s as any).toJSON()),
        };
    }

    static from(raw: any): TransactionSequence {
        const revivedSteps: Step[] = (raw.steps as any[]).map(reviveStep);
        return new TransactionSequence(raw.id, revivedSteps);
    }
}
