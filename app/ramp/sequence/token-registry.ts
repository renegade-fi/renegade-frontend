import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import { getCanonicalTokenInstances } from "./canonical-mainnet-tokens";
import { TOKEN_RULE_OVERLAY } from "./token-rule-overlay";
import { createTokenRules, type GetTokenMeta, type TokenInstance } from "./token-rules";

// Combine dynamic tokens (from token-nextjs) with canonical mainnet overrides.
const allTokens: TokenInstance[] = [
    ...(TokenClass.getAllTokens() as TokenInstance[]),
    ...getCanonicalTokenInstances(),
];

export const getTokenMeta: GetTokenMeta = createTokenRules(allTokens, TOKEN_RULE_OVERLAY);
