import { Token as TokenClass } from "@renegade-fi/token-nextjs";
import { TOKEN_RULE_OVERLAY } from "./token-rule-overlay";
import { createTokenRules, type GetTokenMeta, type TokenInstance } from "./token-rules";
import { getCanonicalTokenInstances } from "./canonical-mainnet-tokens";

// Combine dynamic tokens (from token-nextjs) with canonical mainnet overrides.
const allTokens: TokenInstance[] = [
    ...(TokenClass.getAllTokens() as TokenInstance[]),
    ...getCanonicalTokenInstances(),
];

export const getTokenMeta: GetTokenMeta = createTokenRules(allTokens, TOKEN_RULE_OVERLAY);
