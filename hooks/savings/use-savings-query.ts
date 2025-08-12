import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { useConfig as useWagmiConfig } from "wagmi";

import type { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form";
import { protocolFeeQueryOptions } from "@/hooks/query/fees/protocol";
import { relayerFeeQueryOptions } from "@/hooks/query/fees/relayer";
import { savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function useSavings({ amount, base, isSell, isQuoteCurrency }: NewOrderFormProps) {
    const [debouncedAmount] = useDebounceValue(amount, 1000);
    const config = useWagmiConfig();
    const chainId = useCurrentChain();

    // Fetch protocol + relayer fee in bps
    const { data: protocolFeeBps = 0 } = useQuery(protocolFeeQueryOptions({ chainId, config }));
    const { data: relayerFeeBps = 0 } = useQuery(relayerFeeQueryOptions({ ticker: "USDC" }));

    const renegadeFeeRate = (protocolFeeBps + relayerFeeBps) / 10_000;

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
            enabled: Boolean(
                opts.enabled && protocolFeeBps !== undefined && relayerFeeBps !== undefined,
            ),
        }),
        queryKey: opts.queryKey,
    };
}
