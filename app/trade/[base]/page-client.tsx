'use client'

import { BBOMarquee } from '@/app/trade/[base]/bbo-marquee'
import { NewOrderPanel } from '@/app/trade/[base]/new-order-panel'
import { OrderTable } from '@/app/trade/[base]/order-table'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useMounted } from '@/hooks/use-mounted'

const DEFAULT_LAYOUT = [33, 67]

export function PageClient({
  defaultLayout = DEFAULT_LAYOUT,
  base,
}: {
  defaultLayout?: number[]
  base: string
}) {
  const onLayout = (sizes: number[]) => {
    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
  }
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isMounted = useMounted()

  return (
    <ResizablePanelGroup direction="horizontal" onLayout={onLayout}>
      {(!isMounted || (isMounted && isDesktop)) && (
        <>
          <ResizablePanel
            defaultSize={defaultLayout[0]}
            minSize={DEFAULT_LAYOUT[0]}
            maxSize={50}
            order={1}
          >
            <NewOrderPanel base={base} />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      <ResizablePanel defaultSize={defaultLayout[1]} order={2}>
        <main className="overflow-auto">
          <div className="flex items-center justify-between overflow-hidden">
            <BBOMarquee />
          </div>
          <div className="overflow-auto">
            <div className="grid min-h-[500px] w-full place-items-center">
              Chart
            </div>
            <OrderTable base={base} />
          </div>
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
