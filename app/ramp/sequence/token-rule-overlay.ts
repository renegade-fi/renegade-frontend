import type { TokenRuleMap } from "./token-rules";

// Overlay describing per-token operation availability.
// Only list exceptions – everything unspecified keeps default behaviour.
export const TOKEN_RULE_OVERLAY: TokenRuleMap = {
    // Canonical USDC on Arbitrum One (chainId 42161) accepts swaps from the bridged USDC.e
    USDC: {
        42161: {
            swap: true,
            swapFrom: ["USDC.e", "USDT"],
        },
    },
};
