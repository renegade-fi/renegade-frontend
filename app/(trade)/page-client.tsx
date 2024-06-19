'use client'

import { BBOMarquee } from '@/app/(trade)/bbo-marquee'
import { NewOrderPanel } from '@/app/(trade)/new-order-panel'
import { OrderTable } from '@/app/(trade)/order-table'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export function PageClient({
  defaultLayout = [33, 67],
}: {
  defaultLayout?: number[]
}) {
  const onLayout = (sizes: number[]) => {
    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
  }

  return (
    <ResizablePanelGroup
      autoSaveId="renegade.trade-layout"
      direction="horizontal"
      onLayout={onLayout}
    >
      <ResizablePanel defaultSize={defaultLayout[0]}>
        <NewOrderPanel />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
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
  )
}
