import React from "react";

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";

import { useSavings } from "@/hooks/savings/use-savings-query";
import { useOrderValue } from "@/hooks/use-order-value";
import { PROTOCOL_FEE, RELAYER_FEE } from "@/lib/constants/protocol";

export function usePredictedFees(order: NewOrderFormProps) {
    const { valueInQuoteCurrency } = useOrderValue(order);

    const feesCalculation = React.useMemo(() => {
        const res = {
            relayerFee: 0,
            protocolFee: 0,
        };
        if (!valueInQuoteCurrency) return res;
        res.protocolFee = parseFloat(valueInQuoteCurrency) * PROTOCOL_FEE;
        res.relayerFee = parseFloat(valueInQuoteCurrency) * RELAYER_FEE;
        return res;
    }, [valueInQuoteCurrency]);
    const { data: savingsData, isSuccess } = useSavings(order);

    return {
        ...feesCalculation,
        predictedSavings: isSuccess ? savingsData?.savings : 0,
        predictedSavingsBps: isSuccess ? savingsData?.savingsBps : 0,
    };
}
