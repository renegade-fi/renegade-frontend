"use client"

import { DataTable } from "@/app/orders/data-table"

import { useOrderTableData } from "@/hooks/use-order-table-data"

import { columns } from "./columns"

export function PageClient() {
  const data = useOrderTableData()
  return (
    <main className="container px-4 lg:px-8">
      <div className="mt-12">
        <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
          Orders
        </h1>
        <div className="text-sm font-medium text-muted-foreground lg:mt-2">
          Your private orders. Only you and your connected relayer can see these
          values.
        </div>
        <div className="mt-2 lg:mt-4">
          <DataTable
            columns={columns}
            data={data}
          />
        </div>
      </div>
    </main>
  )
}
