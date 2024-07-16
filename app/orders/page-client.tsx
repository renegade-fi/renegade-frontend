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
      <div className="container space-y-4">
        <h1 className="mt-6 font-serif text-3xl font-bold">Orders</h1>
        <DataTable columns={columns} data={data || []} />
      </div>
    </main>
  )
}
