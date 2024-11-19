import { useBackOfQueueWallet } from "@renegade-fi/react"
import { MAX_BALANCES } from "@renegade-fi/react/constants"

export function useIsMaxBalances(mint?: string) {
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.filter((balance) =>
          Boolean(
            balance.amount ||
              balance.protocol_fee_balance ||
              balance.relayer_fee_balance,
          ),
        ),
    },
  })

  let isMaxBalances = false
  if (mint) {
    isMaxBalances =
      data?.length === MAX_BALANCES && !data?.some((bal) => bal.mint === mint)
  }

  return isMaxBalances
}
