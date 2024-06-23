import { OrderTable } from '@/app/trade/[base]/order-table'

export function PageClient() {
  return (
    <main>
      <div className="container space-y-2">
        <h1 className="font-serif text-3xl font-bold mt-6">Orders</h1>
        <OrderTable />
      </div>
    </main>
  )
}
