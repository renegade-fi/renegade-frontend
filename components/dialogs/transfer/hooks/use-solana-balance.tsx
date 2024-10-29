import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

import { formatNumber } from "@/lib/format"
import { SOLANA_TOKENS } from "@/lib/token"

function useSolanaToken(ticker: string) {
  if (!(ticker in SOLANA_TOKENS)) {
    throw new Error(`Invalid ticker: ${ticker}`)
  }
  return new PublicKey(SOLANA_TOKENS[ticker as keyof typeof SOLANA_TOKENS])
}

export function useTokenAccount(ticker: string) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const mint = useSolanaToken(ticker)
  const params = {
    ownerAddress: publicKey?.toString(),
    args: [mint.toString()],
    chainId: 1151111081099710, // Solana Mainnet
    functionName: "getTokenAccountsByOwner",
  }
  return useQuery({
    queryKey: ["readContract", params],
    queryFn: () =>
      connection.getTokenAccountsByOwner(publicKey!, {
        mint,
      }),
    select: (data) => data.value[0]?.pubkey,
    enabled: !!mint && !!publicKey,
  })
}

export function useSolanaBalance({
  ticker,
  enabled = true,
}: {
  ticker: string
  enabled?: boolean
}) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const { data: tokenAccountAddress } = useTokenAccount(ticker)
  const params = {
    tokenAddress: tokenAccountAddress?.toString(),
    args: [publicKey?.toString()],
    chainId: 1151111081099710, // Solana Mainnet
    functionName: "getTokenAccountBalance",
  }
  const queryKey = ["readContract", params]
  return {
    queryKey,
    ...useQuery({
      queryKey,
      queryFn: () => connection.getTokenAccountBalance(tokenAccountAddress!),
      enabled: !!tokenAccountAddress && !!publicKey && enabled,
    }),
  }
}

export function useSolanaChainBalance({
  ticker,
  enabled = true,
}: {
  ticker: string
  enabled?: boolean
}) {
  const { data: balance, queryKey } = useSolanaBalance({ ticker, enabled })
  const balanceValue = BigInt(balance?.value.amount ?? "0")
  const formattedBalance = balance?.value.uiAmountString ?? ""
  const formattedBalanceLabel = balance?.value.decimals
    ? formatNumber(balanceValue, balance?.value.decimals, true)
    : "--"

  return {
    bigint: balanceValue,
    string: formattedBalance,
    formatted: formattedBalanceLabel,
    queryKey,
    nonZero: Boolean(balanceValue && balanceValue !== BigInt(0)),
  }
}
