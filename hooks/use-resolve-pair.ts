"use client";

import React from "react";

import {
    getDefaultQuote,
    isTickerMultiChain,
    resolveTicker,
    resolveTickerAndChain,
} from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function useResolvePair(base: string) {
    const currentChain = useCurrentChain();

    return React.useMemo(() => {
        // If ticker exists on both chains, resolve to version on current chain
        const isMultiChain = isTickerMultiChain(base);
        if (isMultiChain) {
            const baseToken = resolveTickerAndChain(base, currentChain);
            if (!baseToken) {
                throw new Error(`Base token ${base} not found on chain ${currentChain}`);
            }
            const quoteToken = getDefaultQuote(baseToken.address, "renegade");
            return {
                base: baseToken.address,
                quote: quoteToken.address,
            };
        }

        // Otherwise, resolve to first match in token remaps
        const baseToken = resolveTicker(base);
        const quoteToken = getDefaultQuote(baseToken.address, "renegade");

        return {
            base: baseToken.address,
            quote: quoteToken.address,
        };
    }, [base, currentChain]);
}
