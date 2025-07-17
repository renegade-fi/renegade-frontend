import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

import { formatNumber } from "@/lib/format";
import { SOLANA_TOKENS } from "@/lib/token";
import { solana } from "@/lib/viem";

function useSolanaToken(ticker: string) {
    if (!(ticker in SOLANA_TOKENS)) {
        throw new Error(`Invalid ticker: ${ticker}`);
    }
    return new PublicKey(SOLANA_TOKENS[ticker as keyof typeof SOLANA_TOKENS]);
}

function useTokenAccount(ticker: string) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const mint = useSolanaToken(ticker);
    const params = {
        args: [mint.toString()],
        chainId: solana.id,
        functionName: "getTokenAccountsByOwner",
        ownerAddress: publicKey?.toString(),
    };
    return useQuery({
        enabled: !!mint && !!publicKey,
        queryFn: () =>
            connection.getTokenAccountsByOwner(publicKey!, {
                mint,
            }),
        queryKey: ["readContract", params],
        select: (data) => data.value[0]?.pubkey,
    });
}

function useSolanaBalance({ ticker, enabled = true }: { ticker: string; enabled?: boolean }) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { data: tokenAccountAddress } = useTokenAccount(ticker);
    const params = {
        args: [publicKey?.toString()],
        chainId: solana.id,
        functionName: "getTokenAccountBalance",
        tokenAddress: tokenAccountAddress?.toString(),
    };
    const queryKey = ["readContract", params];
    return {
        queryKey,
        ...useQuery({
            enabled: !!tokenAccountAddress && !!publicKey && enabled,
            queryFn: () => connection.getTokenAccountBalance(tokenAccountAddress!),
            queryKey,
        }),
    };
}

export function useSolanaChainBalance({
    ticker,
    enabled = true,
}: {
    ticker: string;
    enabled?: boolean;
}) {
    const { data: balance, queryKey } = useSolanaBalance({ enabled, ticker });
    const balanceValue = BigInt(balance?.value.amount ?? "0");
    const formattedBalance = balance?.value.uiAmountString ?? "";
    const formattedBalanceLabel = balance?.value.decimals
        ? formatNumber(balanceValue, balance?.value.decimals, true)
        : "--";

    return {
        bigint: balanceValue,
        formatted: formattedBalanceLabel,
        nonZero: Boolean(balanceValue && balanceValue !== BigInt(0)),
        queryKey,
        string: formattedBalance,
    };
}
