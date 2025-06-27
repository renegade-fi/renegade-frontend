import type { SequenceIntent, TxStep } from "./models";
import type { GetTokenMeta } from "./token-rules";

function uuid() {
    return typeof crypto !== "undefined"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
}

/**
 * Pure builder converting an intent into a deterministic list of steps.
 */
export function buildSequence(intent: SequenceIntent, getToken: GetTokenMeta): TxStep[] {
    // Validate token exists on fromChain (throws otherwise)
    const tokenMetaFrom = getToken(intent.tokenTicker, intent.fromChain);

    const makeStep = (type: TxStep["type"], chainId: number): TxStep => ({
        id: uuid(),
        type,
        chainId,
        token: (tokenMetaFrom.address ??
            "0x0000000000000000000000000000000000000000") as `0x${string}`,
        amount: intent.amountAtomic,
        status: "PENDING",
    });

    const steps: TxStep[] = [];

    // 1. APPROVE (stub rule check for now)
    steps.push(makeStep("APPROVE", intent.fromChain));

    // 2. WRAP/UNWRAP TBD

    // 3. BRIDGE if needed
    if (intent.fromChain !== intent.toChain) {
        steps.push(makeStep("BRIDGE", intent.fromChain));
    }

    // 4. Final action
    steps.push(makeStep(intent.kind === "DEPOSIT" ? "DEPOSIT" : "WITHDRAW", intent.toChain));

    return steps;
}
