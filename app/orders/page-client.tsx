"use client"

import { OrderMetadata, Token, useOrderHistory } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { DataTable } from "@/app/orders/data-table"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { constructPriceTopic, usePrice, usePrices } from "@/stores/price-store"

import { columns } from "./columns"

export interface OrderData extends OrderMetadata {
  usdValue: string
}

export function PageClient() {
  const { data } = useOrderHistory({
    query: {
      select: data => Array.from(data?.values() || []),
    },
  })
  const prices = usePrices()
  // Subscribe to USDC price
  usePrice({
    baseAddress: Token.findByTicker("USDC").address,
  })
  const orderData: OrderData[] =
    data?.map(order => {
      const priceTopic = constructPriceTopic({
        baseAddress: order.data.base_mint,
      })
      const price = prices.get(priceTopic) || 0
      const usdValueBigInt = amountTimesPrice(order.data.amount, price)
      const decimals = Token.findByAddress(order.data.base_mint).decimals
      const usdValue = formatUnits(usdValueBigInt, decimals)

      return {
        ...order,
        usdValue,
      }
    }) || []
  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="my-6 font-serif text-3xl font-bold">Orders</h1>
          <div className="pb-4 text-sm font-medium text-muted-foreground">
            Your private orders. Only you and your connected relayer can see
            these values.
          </div>
          <DataTable columns={columns} data={orderData} />
        </div>
      </div>
    </main>
  )
}
