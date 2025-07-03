import { getRoutes, type Route } from "@lifi/sdk";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { ApproveTask } from "../tasks/approve-task";
import { DepositTask } from "../tasks/deposit-task";
import { LiFiLegTask } from "../tasks/lifi-leg-task";
import { PayFeesTask } from "../tasks/pay-fees-task";
import { Permit2SigTask } from "../tasks/permit2-sig-task";
import { WithdrawTask } from "../tasks/withdraw-task";
import { Prereq } from "./prereqs";

/** Request best LI.FI route; thin wrapper mirroring v1 */
async function requestBestRoute(req: Parameters<typeof getRoutes>[0]): Promise<Route> {
    const res = await getRoutes(req);
    if (!res.routes?.length) throw new Error("LiFi: no routes returned");
    return res.routes[0] as Route;
}

// ---------------- Prerequisite Handling ----------------

const prereqMap: Record<TaskType, Prereq[]> = {
    [TASK_TYPES.DEPOSIT]: [Prereq.APPROVAL, Prereq.PERMIT2],
    [TASK_TYPES.WITHDRAW]: [Prereq.PAY_FEES],
    [TASK_TYPES.LIFI_LEG]: [Prereq.APPROVAL],
    [TASK_TYPES.PAY_FEES]: [],
    [TASK_TYPES.PERMIT2_SIG]: [],
    [TASK_TYPES.APPROVE]: [],
};

// Insert union of all planner-handled task types for strong narrowing
export type PlannedTask =
    | DepositTask
    | WithdrawTask
    | LiFiLegTask
    | PayFeesTask
    | Permit2SigTask
    | ApproveTask;

async function prerequisitesFor(
    task: PlannedTask,
    ctx: TaskContext,
    intent: Intent,
): Promise<Task[]> {
    const flags = prereqMap[task.descriptor.type] ?? [];
    const extras: Task[] = [];

    for (const flag of flags) {
        switch (flag) {
            case Prereq.APPROVAL: {
                const req =
                    "approvalRequirement" in task &&
                    typeof (task as any).approvalRequirement === "function"
                        ? await (task as any).approvalRequirement()
                        : undefined;
                if (req) {
                    const { spender, amount } = req;

                    let chainId: number | undefined;
                    let mint: `0x${string}` | undefined;

                    switch (task.descriptor.type) {
                        case TASK_TYPES.DEPOSIT: {
                            const dep = task as DepositTask;
                            chainId = dep.descriptor.chainId;
                            mint = dep.descriptor.mint;
                            break;
                        }
                        case TASK_TYPES.LIFI_LEG: {
                            const leg = task as LiFiLegTask;
                            chainId = leg.chainId;
                            mint = leg.mint;
                            break;
                        }
                        default:
                            break;
                    }

                    if (chainId !== undefined && mint !== undefined) {
                        if (await ApproveTask.isNeeded(ctx, chainId, mint, spender, amount)) {
                            extras.push(ApproveTask.create(chainId, mint, amount, spender, ctx));
                        }
                    }
                }
                break;
            }
            case Prereq.PERMIT2: {
                if (task.descriptor.type === TASK_TYPES.DEPOSIT) {
                    const { chainId, mint, amount } = task.descriptor as DepositTask["descriptor"];
                    extras.push(Permit2SigTask.create(chainId, mint, amount, ctx));
                }
                break;
            }
            case Prereq.PAY_FEES: {
                if (await PayFeesTask.isNeeded(ctx)) {
                    extras.push(PayFeesTask.create(intent.fromChain, ctx));
                }
                break;
            }
            default:
                break;
        }
    }

    return extras;
}

export async function planTasks(intent: Intent, ctx: TaskContext): Promise<Task[]> {
    if (intent.isDeposit()) {
        return planDeposit(intent, ctx);
    }
    if (intent.isWithdraw()) {
        return planWithdraw(intent, ctx);
    }
    throw new Error(`Unsupported intent kind: ${intent.kind}`);
}

async function planDeposit(intent: Intent, ctx: TaskContext): Promise<Task[]> {
    const coreTasks: PlannedTask[] = [];

    if (intent.needsRouting()) {
        const r = await requestBestRoute({
            fromChainId: intent.fromChain,
            toChainId: intent.toChain,
            fromAmount: intent.amountAtomic.toString(),
            fromTokenAddress: intent.fromTokenAddress(),
            toTokenAddress: intent.toTokenAddress(),
            fromAddress: ctx.getOnchainAddress(intent.fromChain),
            toAddress: ctx.getEvmAddress(),
        });

        r.steps.forEach((leg, idx) => {
            const isFinal = idx === r.steps.length - 1;
            coreTasks.push(LiFiLegTask.create(leg, isFinal, ctx));
        });
    }

    // Always finish with deposit
    coreTasks.push(
        DepositTask.create(intent.toChain, intent.toTokenAddress(), intent.amountAtomic, ctx),
    );

    // Inject prereqs
    const ordered: Task[] = [];
    for (const t of coreTasks) {
        ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
    }
    return ordered;
}

async function planWithdraw(intent: Intent, ctx: TaskContext): Promise<Task[]> {
    const coreTasks: PlannedTask[] = [];

    // Start with withdraw
    coreTasks.push(
        WithdrawTask.create(intent.fromChain, intent.fromTokenAddress(), intent.amountAtomic, ctx),
    );

    if (!intent.needsRouting()) {
        // inject prereqs then return
        const ordered: Task[] = [];
        for (const t of coreTasks) {
            ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
        }
        return ordered;
    }

    const route = await requestBestRoute({
        fromChainId: intent.fromChain,
        toChainId: intent.toChain,
        fromAmount: intent.amountAtomic.toString(),
        fromTokenAddress: intent.fromTokenAddress(),
        toTokenAddress: intent.toTokenAddress(),
        fromAddress: ctx.getEvmAddress(),
        toAddress: ctx.getOnchainAddress(intent.toChain),
    });

    route.steps.forEach((leg, idx) => {
        const isFinal = idx === route.steps.length - 1;
        coreTasks.push(LiFiLegTask.create(leg, isFinal, ctx));
    });

    const ordered: Task[] = [];
    for (const t of coreTasks) {
        ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
    }
    return ordered;
}
