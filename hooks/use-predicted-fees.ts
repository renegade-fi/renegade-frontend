import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useConfig as useWagmiConfig } from "wagmi";

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";
import { protocolFeeQueryOptions } from "@/hooks/query/fees/protocol";
import { relayerFeeQueryOptions } from "@/hooks/query/fees/relayer";
import { useSavings } from "@/hooks/savings/use-savings-query";
import { useOrderValue } from "@/hooks/use-order-value";
import { resolveAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { BPS_PER_DECIMAL } from "./query/fees/constants";

export function usePredictedFees(order: NewOrderFormProps) {
    const { valueInQuoteCurrency } = useOrderValue(order);

    // Fetch protocol and relayer fee (bps) in parallel
    const config = useWagmiConfig();
    const chainId = useCurrentChain();
    const { data: protocolFeeBps = 0 } = useQuery(protocolFeeQueryOptions({ chainId, config }));
    const baseTicker = resolveAddress(order.base).ticker;
    const { data: relayerFeeBps = 0 } = useQuery(
        relayerFeeQueryOptions({ chainId, ticker: baseTicker }),
    );

    const totalRenegadeFeeBps = protocolFeeBps + relayerFeeBps;
    const protocolRate = protocolFeeBps / BPS_PER_DECIMAL;
    const relayerRate = relayerFeeBps / BPS_PER_DECIMAL;

    const feesCalculation = React.useMemo(() => {
        const res = {
            protocolFee: 0,
            relayerFee: 0,
        };
        if (!valueInQuoteCurrency) return res;
        const value = parseFloat(valueInQuoteCurrency);
        if (!Number.isFinite(value)) return res;
        res.protocolFee = value * protocolRate;
        res.relayerFee = value * relayerRate;
        return res;
    }, [protocolRate, relayerRate, valueInQuoteCurrency]);

    const { data: savingsData, isSuccess } = useSavings(order);

    return {
        protocolFeeBps,
        relayerFeeBps,
        ...feesCalculation,
        predictedSavings: isSuccess ? savingsData?.savings : 0,
        predictedSavingsBps: isSuccess ? savingsData?.savingsBps : 0,
        totalRenegadeFeeBps,
    };
}
