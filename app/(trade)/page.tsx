import { BBOBanner } from '@/app/(trade)/bbo-banner'
import { LineChart } from '@/app/(trade)/chart'
import { NewOrderPanel } from '@/app/(trade)/new-order-panel'
import { OrderTable } from '@/app/(trade)/order-table'
import { TokensBanner } from '@/app/(trade)/tokens-banner'
import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function Page() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15}>
            <NewOrderPanel />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <main className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <BBOBanner />
              </div>
              <div className="flex-1">
                <div className="grid min-h-[500px] w-full place-items-center">
                  <span>Chart</span>
                </div>
              </div>
              <div className="p-4">
                <OrderTable />
              </div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <TokensBanner />
      <Footer />
    </div>
  )
}
