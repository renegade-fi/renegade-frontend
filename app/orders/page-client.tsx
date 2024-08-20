"use client"

import { DataTable } from "@/app/orders/data-table"

import { useOrderTableData } from "@/hooks/use-order-table-data"

import { columns } from "./columns"

export function PageClient() {
  const data = useOrderTableData()
  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="mb-1 mt-6 font-serif text-3xl font-bold">Orders</h1>
          <div className="pb-4 text-sm font-medium text-muted-foreground">
            Your private orders. Only you and your connected relayer can see
            these values.
          </div>
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>
    </main>
  )
}
