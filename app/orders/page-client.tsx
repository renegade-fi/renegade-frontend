'use client'

import { useOrderHistory } from '@renegade-fi/react'

import { DataTable } from '@/app/orders/data-table'

import { columns } from './columns'

export function PageClient() {
  const { data } = useOrderHistory({
    query: {
      select: data => Array.from(data?.values() || []),
    },
  })
  return (
    <main>
      <div className="container space-y-2">
        <h1 className="mt-6 font-serif text-3xl font-bold">Orders</h1>
        <div className="pt-4">
          <DataTable columns={columns} data={data || []} />
        </div>
      </div>
    </main>
  )
}
