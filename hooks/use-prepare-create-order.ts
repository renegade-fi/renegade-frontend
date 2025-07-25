"use client";

import { ConfigRequiredError } from "@renegade-fi/react";
import { MAX_ORDERS } from "@renegade-fi/react/constants";
import { useQuery } from "@tanstack/react-query";
import { toHex } from "viem";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { safeParseUnits } from "@/lib/format";
import { resolveAddress } from "@/lib/token";
import { useConfig } from "@/providers/state-provider/hooks";

import { stringifyForWasm } from "./query/utils";

type UsePrepareCreateOrderParameters = {
    id?: string;
    base: `0x${string}`;
    quote: `0x${string}`;
    side: "buy" | "sell";
    amount: string;
    worstCasePrice: string;
    allowExternalMatches: boolean;
};

export function usePrepareCreateOrder(parameters: UsePrepareCreateOrderParameters) {
    const { id = "", base, quote, side, amount, worstCasePrice, allowExternalMatches } = parameters;
    const config = useConfig();
    const { data: wallet, isSuccess } = useBackOfQueueWallet();

    return useQuery({
        enabled: isSuccess && Boolean(config?.state.seed),
        queryFn: async () => {
            if (!config) throw new ConfigRequiredError("usePrepareCreateOrder");
            if (!config.state.seed) throw new Error("Seed is required");
            if (!isSuccess) throw new Error("Failed to fetch wallet.");
            if (wallet.orders.filter((order) => order.amount).length >= MAX_ORDERS)
                throw new Error("Max orders reached.");
            if (!worstCasePrice) throw new Error("Worst case price is required");

            const parsedAmount = safeParseUnits(amount, resolveAddress(base).decimals);
            if (parsedAmount instanceof Error) throw new Error("Failed to parse amount.");

            return config.utils.new_order(
                config.state.seed,
                stringifyForWasm(wallet),
                id,
                base,
                quote,
                side,
                toHex(parsedAmount),
                worstCasePrice,
                toHex(BigInt(0)),
                allowExternalMatches,
            );
        },
        queryKey: ["prepare", "create-order", parameters],
    });
}
