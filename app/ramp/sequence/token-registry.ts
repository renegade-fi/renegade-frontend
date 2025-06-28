import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import { getCanonicalTokenInstances } from "./canonical-mainnet-tokens";
import { TOKEN_RULE_OVERLAY } from "./token-rule-overlay";
import { createTokenRules, type GetTokenMeta, type TokenInstance } from "./token-rules";

// Combine dynamic tokens (from token-nextjs) with canonical mainnet overrides.
const allTokens: TokenInstance[] = [
    ...(TokenClass.getAllTokens() as TokenInstance[]),
    ...getCanonicalTokenInstances(),
];

// Debug: list loaded tokens once at startup to verify chain coverage
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    // Group by ticker for easier inspection
    const summary = allTokens.reduce<
        Record<string, Array<{ chain: number | undefined; address: string }>>
    >((acc, t) => {
        const arr = acc[t.ticker] ?? [];
        arr.push({ chain: (t as any).chain, address: (t as any).address });
        acc[t.ticker] = arr;
        return acc;
    }, {});
    // eslint-disable-next-line no-console
    console.debug("[TOKEN-REGISTRY] Loaded token map", summary);
}

export const getTokenMeta: GetTokenMeta = createTokenRules(allTokens, TOKEN_RULE_OVERLAY);
