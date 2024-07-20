"use client"

import { OrderMetadata, Token } from "@renegade-fi/react"

import { FillTableData, columns } from "@/app/trade/[base]/components/columns"
import { DataTable } from "@/app/trade/[base]/components/data-table"

import { formatCurrency, formatNumber } from "@/lib/format"
import { usePrice } from "@/stores/price-store"

export function FillTable({ order }: { order: OrderMetadata }) {
  const token = Token.findByAddress(order.data.base_mint)
  const price = usePrice({ baseAddress: order.data.base_mint })
  const data: FillTableData[] = order.fills.map((fill, index) => {
    const amount = formatNumber(fill.amount, token.decimals)
    return {
      index,
      amount,
      amountUSD: formatCurrency(price * Number(amount)),
      timestamp: Number(fill.price.timestamp) * 1000,
    }
  })
  return (
    <div className="p-4">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
