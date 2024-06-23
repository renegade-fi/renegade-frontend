import { AssetsTable } from '@/app/assets/assets-table'
import { TransferHistoryTable } from '@/app/assets/transfer-history-table'

export function PageClient() {
  return (
    <main>
      <div className="container space-y-6">
        <div>
          <h1 className="mt-6 font-serif text-3xl font-bold">Assets</h1>
          <AssetsTable />
        </div>
        <div>
          <h1 className="mt-6 font-serif text-3xl font-bold">
            Transfer History
          </h1>
          <TransferHistoryTable />
        </div>
      </div>
    </main>
  )
}
