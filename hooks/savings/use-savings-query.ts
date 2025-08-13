import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { useConfig as useWagmiConfig } from "wagmi";

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";
import { protocolFeeQueryOptions } from "@/hooks/query/fees/protocol";
import { relayerFeeQueryOptions } from "@/hooks/query/fees/relayer";
import { savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions";
import { resolveAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { BPS_PER_DECIMAL } from "../query/fees/constants";

export function useSavings({ amount, base, isSell, isQuoteCurrency }: NewOrderFormProps) {
    const [debouncedAmount] = useDebounceValue(amount, 1000);
    const config = useWagmiConfig();
    const chainId = useCurrentChain();

    const baseTicker = resolveAddress(base).ticker;

    // Fetch protocol + relayer fee in bps
    const { data: protocolFee = 0 } = useQuery({
        ...protocolFeeQueryOptions({ chainId, config }),
        select: (bps) => bps / BPS_PER_DECIMAL,
    });
    const { data: relayerFee = 0 } = useQuery({
        ...relayerFeeQueryOptions({ chainId, ticker: baseTicker }),
        select: (map) => {
            const value = map.get(baseTicker);
            if (!value) {
                throw new Error(`Relayer fee not found for ticker: ${baseTicker}`);
            }
            return value / BPS_PER_DECIMAL;
        },
    });

    const renegadeFeeRate = protocolFee + relayerFee;

    const opts = savingsQueryOptions({
        amount: debouncedAmount,
        baseMint: base,
        direction: isSell ? "sell" : "buy",
        isQuoteCurrency,
        quoteTicker: "USDC",
        renegadeFeeRate,
    });

    return {
        ...useQuery({
            ...opts,
            enabled: Boolean(opts.enabled && protocolFee !== undefined && relayerFee !== undefined),
        }),
        queryKey: opts.queryKey,
    };
}
