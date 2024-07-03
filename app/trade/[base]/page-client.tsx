'use client'

import { useMediaQuery } from '@/hooks/use-media-query'
import { useMounted } from '@/hooks/use-mounted'
import { STORAGE_LAYOUT } from '@/lib/constants/storage'

import { BBOMarquee } from '@/app/trade/[base]/bbo-marquee'
import { Chart } from '@/app/trade/[base]/chart'
import { NewOrderPanel } from '@/app/trade/[base]/new-order-panel'
import { OrderTable } from '@/app/trade/[base]/order-table'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Separator } from '@/components/ui/separator'

const DEFAULT_LAYOUT = [22, 78]
const DEFAULT_SIDE = 'buy'

export function PageClient({
  defaultLayout = DEFAULT_LAYOUT,
  side = DEFAULT_SIDE,
  base,
}: {
  defaultLayout?: number[]
  side?: string
  base: string
}) {
  const onLayout = (sizes: number[]) => {
    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
  }
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isMounted = useMounted()

  return (
    <>
      <ResizablePanelGroup
        autoSaveId={STORAGE_LAYOUT}
        direction="horizontal"
        onLayout={onLayout}
      >
        {(!isMounted || (isMounted && isDesktop)) && (
          <>
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              minSize={DEFAULT_LAYOUT[0]}
              maxSize={50}
              order={1}
            >
              <NewOrderPanel base={base} side={side} />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel defaultSize={defaultLayout[1]} order={2}>
          <main>
            <BBOMarquee />
            <div className="overflow-auto">
              <Chart base={base} />
              <Separator />
              <OrderTable base={base} />
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}
