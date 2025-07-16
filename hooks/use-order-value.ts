import { useQuery } from "@tanstack/react-query";
import React from "react";
import { formatUnits } from "viem/utils";
import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { safeParseUnits } from "@/lib/format";
import { resolveAddress } from "@/lib/token";
import { useServerStore } from "@/providers/state-provider/server-store-provider";
import { priceQueryOptions } from "./use-price-query";

/**
 * Hook to calculate the order value in both quote and base currency.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {string} params.amount - The amount of the base currency (decimal corrected).
 * @param {string} params.base - The ticker symbol of the base currency.
 * @param {boolean} params.isQuoteCurrency - Indicates if the amount is in quote currency.
 * @returns {Object} - An object containing the value in quote currency and the value in base currency, both decimal corrected.
 */
export function useOrderValue({ amount, base, isQuoteCurrency }: NewOrderFormProps) {
    const baseToken = resolveAddress(base);
    const quoteMint = useServerStore((state) => state.quoteMint);
    const quoteToken = resolveAddress(quoteMint);
    const { data: usdPerBase } = useQuery({
        ...priceQueryOptions({ baseMint: baseToken.address, isSnapshot: true }),
        refetchInterval: 2000,
    });

    // Calculate the inverse of the USD price per base token
    const basePerUsd = React.useMemo(() => {
        if (!usdPerBase) return "";
        return 1 / usdPerBase;
    }, [usdPerBase]);

    // Calculate the value in quote currency
    const valueInQuoteCurrency = React.useMemo(() => {
        if (!usdPerBase) return "";

        // If the amount is in quote currency, return the amount directly
        if (isQuoteCurrency) {
            return amount;
        }

        // Convert amount to non-decimal corrected amount
        const rawAmount = safeParseUnits(amount, baseToken.decimals);
        if (rawAmount instanceof Error) {
            return "";
        }

        // Calculate the value in quote currency
        const valueInQuote = amountTimesPrice(rawAmount, usdPerBase);
        const decimalCorrectedValue = formatUnits(valueInQuote, baseToken.decimals);
        return decimalCorrectedValue;
    }, [amount, baseToken.decimals, isQuoteCurrency, usdPerBase]);

    // Calculate the value in base currency
    const valueInBaseCurrency = React.useMemo(() => {
        if (!basePerUsd) return "";

        // If the amount is in base currency, return the amount directly
        if (!isQuoteCurrency) {
            return amount;
        }

        // Convert amount to non-decimal corrected amount
        const rawAmount = safeParseUnits(amount, quoteToken.decimals);
        if (rawAmount instanceof Error) {
            return "";
        }

        // Calculate the value in base currency
        const valueInBase = amountTimesPrice(rawAmount, basePerUsd);
        const decimalCorrectedValue = formatUnits(valueInBase, quoteToken.decimals);
        return decimalCorrectedValue;
    }, [amount, basePerUsd, isQuoteCurrency, quoteToken.decimals]);

    // TODO: Calculations should only be done with bigints
    return {
        valueInQuoteCurrency,
        valueInBaseCurrency,
    };
}
