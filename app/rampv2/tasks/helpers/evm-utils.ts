import { getChainId, switchChain } from "wagmi/actions";
import { solana } from "@/lib/viem";
import type { TaskContext } from "../../core/task-context";

export async function ensureCorrectChain(ctx: TaskContext, targetChainId: number) {
    if (targetChainId === solana.id) return;
    const current = getChainId(ctx.wagmiConfig);
    if (current === targetChainId) return;
    await switchChain(ctx.wagmiConfig, { chainId: targetChainId });
}
