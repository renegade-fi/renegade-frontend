import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { useQuery } from "@tanstack/react-query"

import { SOLANA_TOKENS } from "@/lib/token"

export function useSolanaBalance({
  ticker,
  enabled = true,
}: {
  ticker: string
  enabled?: boolean
}) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const token =
    ticker in SOLANA_TOKENS
      ? new PublicKey(SOLANA_TOKENS[ticker as keyof typeof SOLANA_TOKENS])
      : undefined
  const params = {
    address: token?.toString(),
    args: [publicKey?.toString()],
    chainId: 900, // Solana Mainnet
    functionName: "getTokenAccountBalance",
  }
  const queryKey = ["readContract", params]
  return useQuery({
    queryKey,
    queryFn: () => connection.getTokenAccountBalance(token!),
    enabled: !!token && !!publicKey,
  })
}
