import { BBOBanner } from '@/app/(trade)/bbo-banner'
import { LineChart } from '@/app/(trade)/chart'
import { NewOrderPanel } from '@/app/(trade)/new-order-panel'
import { OrderTable } from '@/app/(trade)/order-table'
import { TokensBanner } from '@/app/(trade)/tokens-banner'
import { Footer } from '@/app/footer'
import { Header } from '@/app/header'

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-96">
          <NewOrderPanel />
        </div>
        <main className="flex flex-1 flex-col">
          <div className="flex items-center justify-between p-4">
            <BBOBanner />
          </div>
          <div className="flex-1">
            <div className="h-full w-full">
              <LineChart />
            </div>
          </div>
          <div className="p-4">
            <OrderTable />
          </div>
        </main>
      </div>
      <TokensBanner />
      <Footer />
    </div>
  )
}
