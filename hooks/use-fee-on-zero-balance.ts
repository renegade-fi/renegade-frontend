import { useWallet } from "@renegade-fi/react"

export function useFeeOnZeroBalance() {
  const { data } = useWallet({
    query: {
      select: (data) =>
        data.balances
          .filter((balance) => balance.amount === BigInt(0))
          .some(
            (balance) =>
              balance.protocol_fee_balance > BigInt(0) ||
              balance.relayer_fee_balance > BigInt(0),
          ),
    },
  })

  return Boolean(data)
}
