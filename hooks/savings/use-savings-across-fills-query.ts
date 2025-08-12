import type { OrderMetadata } from "@renegade-fi/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem/utils";
import { useConfig as useWagmiConfig } from "wagmi";
import { protocolFeeQueryOptions } from "@/hooks/query/fees/protocol";
import { relayerFeeQueryOptions } from "@/hooks/query/fees/relayer";
import { type SavingsData, savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions";
import { resolveAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function useSavingsAcrossFillsQuery(order: OrderMetadata) {
    const isSell = order.data.side === "Sell";
    const config = useWagmiConfig();
    const chainId = useCurrentChain();

    // Fetch fees once for all fills
    const { data: protocolFeeBps = 0 } = useQuery(protocolFeeQueryOptions({ chainId, config }));
    const { data: relayerFeeBps = 0 } = useQuery(relayerFeeQueryOptions({ ticker: undefined }));

    const feesReady = protocolFeeBps !== undefined && relayerFeeBps !== undefined;
    const renegadeFeeRate = (protocolFeeBps + relayerFeeBps) / 10_000;

    const queries = !feesReady
        ? []
        : order.fills.map((fill) => {
              const baseToken = resolveAddress(order.data.base_mint);
              const amount = formatUnits(fill.amount, baseToken.decimals);
              return {
                  ...savingsQueryOptions({
                      amount,
                      baseMint: order.data.base_mint,
                      direction: isSell ? "sell" : "buy",
                      isQuoteCurrency: false,
                      quoteTicker: "USDC",
                      renegadeFeeRate,
                      timestamp: Number.parseInt(fill.price.timestamp.toString()),
                  }),
                  gcTime: Infinity,
                  staleTime: Infinity,
              };
          });

    return useQueries({
        combine: (results) => {
            return results.reduce(
                (acc, cur) => ({
                    savings: acc.savings + (cur.data?.savings ?? 0),
                    savingsBps: acc.savingsBps + (cur.data?.savingsBps ?? 0),
                }),
                { savings: 0, savingsBps: 0 } as SavingsData,
            );
        },
        queries,
    });
}
