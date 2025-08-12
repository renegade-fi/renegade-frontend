import type { OrderMetadata } from "@renegade-fi/react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem/utils";
import { useConfig as useWagmiConfig } from "wagmi";
import { BPS_PER_DECIMAL } from "@/hooks/query/fees/constants";
import { protocolFeeQueryOptions } from "@/hooks/query/fees/protocol";
import { relayerFeeMapQueryOptions } from "@/hooks/query/fees/relayer";
import { type SavingsData, savingsQueryOptions } from "@/hooks/savings/savingsQueryOptions";
import { resolveAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function useSavingsAcrossFillsQuery(order: OrderMetadata) {
    const isSell = order.data.side === "Sell";
    const config = useWagmiConfig();
    const chainId = useCurrentChain();

    // Fetch protocol fee and relayer fee map once for all fills
    const { data: protocolFeeDecimal = 0 } = useQuery({
        ...protocolFeeQueryOptions({ chainId, config }),
        select: (bps) => bps / BPS_PER_DECIMAL, // convert bps to decimal
    });
    const { data: relayerFeeMap } = useQuery({
        ...relayerFeeMapQueryOptions({ chainId }),
        select: (map) => {
            // Convert all to decimal
            const newMap = new Map<string, number>();
            for (const [ticker, bps] of map) {
                const decimal = bps / BPS_PER_DECIMAL; // convert bps to decimal
                newMap.set(ticker, decimal);
            }
            return newMap;
        },
    });

    const baseTicker = resolveAddress(order.data.base_mint).ticker.toUpperCase();
    const relayerFeeDecimal = relayerFeeMap?.get(baseTicker);

    const feesReady = protocolFeeDecimal !== undefined && relayerFeeDecimal !== undefined;
    console.log("fills debug", {
        feesReady,
        protocolFeeDecimal,
        relayerFeeDecimal,
        relayerFeeMap,
    });
    const renegadeFeeRate = feesReady ? protocolFeeDecimal + relayerFeeDecimal : 0;

    const queries = feesReady
        ? order.fills.map((fill) => {
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
          })
        : [];

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
