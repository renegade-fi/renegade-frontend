import { AssetsTable } from '@/app/assets/assets-table'

export function PageClient() {
  return (
    <main className="mt-6">
      <div className="container">
        <h1 className="font-serif text-3xl font-bold">Assets</h1>
        <AssetsTable />
      </div>
    </main>
  )
}
