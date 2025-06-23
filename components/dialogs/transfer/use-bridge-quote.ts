import { getQuote, type QuoteRequest } from "@lifi/sdk";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { mainnet } from "viem/chains";
import { useAccount, useConfig } from "wagmi";

import { safeParseUnits } from "@/lib/format";
import { resolveAddress } from "@/lib/token";
import { solana } from "@/lib/viem";

interface UseBridgeParams {
    fromChain?: number;
    fromMint: string;
    toChain?: number;
    toMint: `0x${string}`;
    amount: string;
    enabled?: boolean;
}

export function useBridgeQuote({
    fromMint,
    toMint,
    amount,
    enabled = true,
    fromChain,
    toChain,
}: UseBridgeParams) {
    const params = useParams({ fromMint, toMint, amount, fromChain, toChain });
    const queryKey = ["bridge", "quote", fromChain, toChain, fromMint, toMint, amount];
    return {
        queryKey,
        ...useQuery({
            queryKey,
            queryFn: () => getQuote(params!),
            enabled: Boolean(enabled && params),
            refetchOnWindowFocus: false,
            staleTime: Infinity,
        }),
    };
}

export const allowBridges = ["across", "mayan"];

function useParams({
    fromMint,
    toMint,
    amount,
    fromChain,
    toChain,
}: UseBridgeParams): QuoteRequest | undefined {
    const config = useConfig();
    const evmChains = [mainnet, ...config.chains];
    const { address } = useAccount();
    const { publicKey: solanaWallet } = useSolanaWallet();
    const fromAddress = evmChains.some((chain) => chain.id === fromChain)
        ? address
        : fromChain === solana.id
          ? solanaWallet?.toString()
          : undefined;
    if (!fromAddress || !toMint || !Number(amount) || !fromChain || !toChain) {
        return undefined;
    }

    const token = resolveAddress(toMint);
    const parsedAmount = safeParseUnits(amount, token.decimals);

    if (parsedAmount instanceof Error) {
        return undefined;
    }
    return {
        fromChain,
        fromToken: fromMint,
        fromAddress,
        fromAmount: parsedAmount.toString(),
        toAddress: address,
        toChain,
        toToken: toMint,
        order: "FASTEST",
        slippage: 0.005,
        allowBridges,
        allowExchanges: [],
    };
}
