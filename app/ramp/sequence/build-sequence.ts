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
    // Utility to fetch token address for a given chain. Falls back to zero address and logs a warning.
    const tokenOn = (chainId: number): `0x${string}` => {
        try {
            const meta = getToken(intent.tokenTicker, chainId);
            if (!meta.address) {
                console.warn(
                    `[BUILD] token meta missing address`,
                    intent.tokenTicker,
                    chainId,
                    meta,
                );
                return "0x0000000000000000000000000000000000000000";
            }
            return meta.address as `0x${string}`;
        } catch (err) {
            console.warn(
                `[BUILD] token lookup failed for`,
                intent.tokenTicker,
                `on chain`,
                chainId,
                err,
            );
            return "0x0000000000000000000000000000000000000000";
        }
    };

    const makeStep = (type: TxStep["type"], chainId: number): TxStep => {
        const step: TxStep = {
            id: uuid(),
            type,
            chainId,
            mint: tokenOn(chainId),
            amount: intent.amountAtomic,
            status: "PENDING",
        };
        console.debug("[BUILD]", type, chainId, step.mint);
        return step;
    };

    const steps: TxStep[] = [];

    const finalAction: TxStep["type"] = intent.kind === "DEPOSIT" ? "DEPOSIT" : "WITHDRAW";

    // If bridging (fromChain -> toChain)
    if (intent.fromChain !== intent.toChain) {
        // 1. BRIDGE on fromChain (mainnet → L2)
        steps.push(makeStep("BRIDGE", intent.fromChain));

        // 2. APPROVE on destination chain, required before deposit/withdraw
        steps.push(makeStep("APPROVE", intent.toChain));
    } else {
        // No bridge needed; approve on the same chain
        steps.push(makeStep("APPROVE", intent.fromChain));
    }

    // 3. WRAP/UNWRAP TBD

    // 4. Final action (deposit or withdraw) always on toChain
    steps.push(makeStep(finalAction, intent.toChain));

    return steps;
}
