import { OrderMetadata } from "@renegade-fi/react"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { resolveAddress } from "@/lib/token"
import { decimalNormalizePrice } from "@/lib/utils"

export function getVWAP(order: OrderMetadata): number {
  if (order.fills.length === 0) {
    return 0
  }

  const token = resolveAddress(order.data.base_mint)
  const quoteToken = resolveAddress(order.data.quote_mint)

  let totalVolume = BigInt(0)
  let totalValue = BigInt(0)

  for (const fill of order.fills) {
    const fillVolume = fill.amount
    const fillValue = amountTimesPrice(
      fill.amount,
      decimalNormalizePrice(
        fill.price.price,
        token.decimals,
        quoteToken.decimals,
      ),
    )

    totalVolume += fillVolume
    totalValue += fillValue
  }

  if (totalVolume === BigInt(0)) {
    return 0
  }

  return Number(totalValue) / Number(totalVolume)
}

interface SyncOrdersWithWalletStateParams {
  /** The map of orders to filter */
  orders: Map<string, OrderMetadata>
  /** Optional array of order IDs that exist in the wallet's current state */
  walletOrderIds?: string[]
}

/**
 * Filters orders to maintain consistency with the wallet's current state.
 *
 * This enforces the invariant that non-terminal orders (orders that are not Filled or Cancelled)
 * must exist in the wallet's current orders. Terminal orders are always included regardless
 * of wallet state.
 *
 * This is necessary because the order history can fall out of sync with the wallet's
 * current state.
 *
 * @example
 * ```ts
 * const walletOrderIds = useBackOfQueueWallet({
 *   query: { select: (data) => data?.orders?.map(order => order.id) ?? [] }
 * })
 *
 * const validOrders = syncOrdersWithWalletState({ orders: allOrders, walletOrderIds })
 * ```
 */
export function syncOrdersWithWalletState({
  orders,
  walletOrderIds,
}: SyncOrdersWithWalletStateParams): Map<string, OrderMetadata> {
  return new Map(
    Array.from(orders.entries()).filter(([_, order]) => {
      const isTerminal = order.state === "Filled" || order.state === "Cancelled"
      if (isTerminal) return true

      return walletOrderIds?.includes(order.id) ?? false
    }),
  )
}
