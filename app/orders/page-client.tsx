import { OrderTable } from '@/app/trade/[base]/order-table'

export function PageClient() {
  return (
    <main>
      <div className="container">
        <h1 className="font-serif text-3xl font-bold">Orders</h1>
        <OrderTable />
      </div>
    </main>
  )
}
