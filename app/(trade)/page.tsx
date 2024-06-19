import { BBOMarquee } from '@/app/(trade)/bbo-marquee'
import { NewOrderPanel } from '@/app/(trade)/new-order-panel'
import { OrderTable } from '@/app/(trade)/order-table'
import { TokensMarquee } from '@/app/(trade)/tokens-marquee'
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
        <ResizablePanelGroup
          autoSaveId="renegade.trade-layout"
          direction="horizontal"
        >
          <ResizablePanel defaultSize={15}>
            <NewOrderPanel />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <main className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <BBOMarquee />
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
      <TokensMarquee />
      <Footer />
    </div>
  )
}
