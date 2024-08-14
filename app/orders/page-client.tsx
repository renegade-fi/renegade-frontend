"use client"

import { useOrderHistory } from "@renegade-fi/react"

import { DataTable } from "@/app/orders/data-table"

import { columns } from "./columns"

export function PageClient() {
  const { data } = useOrderHistory({
    query: {
      select: data => Array.from(data?.values() || []),
    },
  })
  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="my-6 font-serif text-3xl font-bold">Orders</h1>
          <div className="pb-4 text-sm font-medium text-muted-foreground">
            Your private orders. Only you and your connected relayer can see
            these values.
          </div>
          <DataTable columns={columns} data={data || []} />
        </div>
      </div>
    </main>
  )
}
