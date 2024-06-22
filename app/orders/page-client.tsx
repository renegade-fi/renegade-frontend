import { OrderTable } from '@/app/trade/[base]/order-table'

export function PageClient() {
  return (
    <main className="mt-6">
      <div className="container">
        <h1 className="font-serif text-3xl font-bold">Orders</h1>
        <OrderTable />
      </div>
    </main>
  )
}
