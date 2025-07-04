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
                const approve = ApproveTask.fromCoreTask(task, ctx);
                if (approve) extras.push(approve);
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
                extras.push(PayFeesTask.create(intent.fromChain, ctx));
                break;
            }
            default:
                break;
        }
    }

    return extras;
}

/** Filter out unneeded tasks in a single parallel sweep. */
async function filterNeeded(tasks: Task[], ctx: TaskContext): Promise<Task[]> {
    const neededFlags = await Promise.all(
        tasks.map(async (t) => {
            try {
                return await t.isNeeded(ctx);
            } catch {
                return true; // fallback: keep task if error occurs
            }
        }),
    );
    return tasks.filter((_, i) => neededFlags[i]);
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
    const bridgeNeeded = intent.fromChain !== intent.toChain;
    const swapNeeded = intent.fromTokenAddress !== intent.toTokenAddress;

    let route: Route | undefined;
    if (bridgeNeeded) {
        route = await getBridgeRoute(intent, ctx);
    } else if (swapNeeded) {
        route = await getSwapRoute(intent, ctx);
    }

    if (route) {
        route.steps.forEach((leg, idx) => {
            const isFinal = idx === route.steps.length - 1;
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

    // Inject prereqs then filter
    let ordered: Task[] = [];
    for (const t of coreTasks) {
        ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
    }
    console.log("task order pre-filter", ordered);
    ordered = await filterNeeded(ordered, ctx);
    console.log("task order post-filter", ordered);
    return ordered;
}

async function getBridgeRoute(intent: Intent, ctx: TaskContext): Promise<Route> {
    const routeReq = intent.toLifiRouteRequest();
    return requestBestRoute(routeReq);
}

async function getSwapRoute(intent: Intent, ctx: TaskContext): Promise<Route | undefined> {
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
        // Build a route request identical to intent.toLifiRouteRequest() but with shortfall.
        const routeReq = intent.toLifiRouteRequest();
        routeReq.fromAmount = shortfall.toString();

        return requestBestRoute(routeReq);
    }
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
        let ordered: Task[] = [];
        for (const t of coreTasks) {
            ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
        }
        ordered = await filterNeeded(ordered, ctx);
        return ordered;
    }

    const route = await requestBestRoute(intent.toLifiRouteRequest());

    route.steps.forEach((leg, idx) => {
        const isFinal = idx === route.steps.length - 1;
        coreTasks.push(LiFiLegTask.create(leg, isFinal, ctx));
    });

    let ordered: Task[] = [];
    for (const t of coreTasks) {
        ordered.push(...(await prerequisitesFor(t, ctx, intent)), t);
    }
    ordered = await filterNeeded(ordered, ctx);
    return ordered;
}
