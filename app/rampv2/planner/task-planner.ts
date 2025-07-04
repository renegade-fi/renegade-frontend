import { getRoutes, type Route } from "@lifi/sdk";
import { getBalance } from "wagmi/actions";
import { readErc20BalanceOf } from "@/lib/generated";
import { solana } from "@/lib/viem";
import { balanceKey } from "../core/balance-utils";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import type { TaskContext } from "../core/task-context";
import { TASK_TYPES, type TaskType } from "../core/task-types";
import { isETH } from "../helpers";
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

// Helper type for tasks that expose an approvalRequirement() method
// and a simple type-guard so the compiler can treat them safely.
type HasApprovalRequirement = {
    approvalRequirement: () =>
        | { spender: `0x${string}`; amount: bigint }
        | Promise<{ spender: `0x${string}`; amount: bigint } | undefined>
        | undefined;
};
function hasApprovalRequirement(task: PlannedTask): task is PlannedTask & HasApprovalRequirement {
    return (
        // Use the in-operator to avoid casting to any while still performing a
        // runtime check. Only DepositTask and LiFiLegTask satisfy this.
        "approvalRequirement" in task &&
        typeof (task as Partial<HasApprovalRequirement>).approvalRequirement === "function"
    );
}

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
                const req = hasApprovalRequirement(task)
                    ? await task.approvalRequirement()
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
                            console.log("ApproveTask.create", chainId, mint, amount, spender, ctx);
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

async function getWalletBalance(
    ctx: TaskContext,
    chainId: number,
    token: `0x${string}`,
    owner: string,
): Promise<bigint> {
    const key = balanceKey(chainId, token);
    if (key in ctx.balances) return ctx.balances[key];

    // Fallback – should rarely happen for ramp flows.
    if (chainId === solana.id) {
        // Solana support not implemented in planner cache fallback.
        return BigInt(0);
    }

    if (isETH(token, chainId)) {
        const bal = await getBalance(ctx.wagmiConfig, {
            address: owner as `0x${string}`,
        });
        return bal.value;
    }

    const bal = await readErc20BalanceOf(ctx.wagmiConfig, {
        address: token,
        args: [owner as `0x${string}`],
        chainId,
    });
    return bal;
}

async function planDeposit(intent: Intent, ctx: TaskContext): Promise<Task[]> {
    const coreTasks: PlannedTask[] = [];

    // Determine how much of the desired deposit is already available.
    const owner = ctx.getOnchainAddress(intent.toChain);
    const initialBal = await getWalletBalance(
        ctx,
        intent.toChain,
        intent.toTokenAddress as `0x${string}`,
        owner,
    );

    const shortfall =
        intent.amountAtomic > initialBal ? intent.amountAtomic - initialBal : BigInt(0);

    if (shortfall > BigInt(0)) {
        console.log("planning step debug", {
            shortfall,
            initialBal,
            intentAmount: intent.amountAtomic,
        });
        // Build a route request identical to intent.toLifiRouteRequest() but with shortfall.
        const routeReq = intent.toLifiRouteRequest();
        routeReq.fromAmount = shortfall.toString();

        const r = await requestBestRoute(routeReq);

        r.steps.forEach((leg, idx) => {
            const isFinal = idx === r.steps.length - 1;
            coreTasks.push(LiFiLegTask.create(leg, isFinal, ctx));
        });
    }

    // Always finish with deposit
    // TODO: Validate isAddress since only ERC20 can be deposited
    coreTasks.push(
        DepositTask.create(
            intent.toChain,
            intent.toTokenAddress as `0x${string}`,
            intent.amountAtomic,
            ctx,
        ),
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
    // TODO: Validate isAddress since only ERC20 can be withdrawn
    coreTasks.push(
        WithdrawTask.create(
            intent.fromChain,
            intent.fromTokenAddress as `0x${string}`,
            intent.amountAtomic,
            ctx,
        ),
    );

    if (!intent.needsRouting()) {
        // inject prereqs then return
        const ordered: Task[] = [];
        for (const t of coreTasks) {
            ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
        }
        return ordered;
    }

    const route = await requestBestRoute(intent.toLifiRouteRequest());

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
