import { cookies } from 'next/headers'

import { STORAGE_SIDE, STORAGE_USDC_DENOMINATED } from '@/lib/constants/storage'
import { Ellipsis, Settings, Settings2 } from 'lucide-react'

import { Footer } from '@/app/footer'
import { Header } from '@/app/header'
import { PageClient } from '@/app/trade/[base]/page-client'
import { SettingsPopover } from '@/app/trade/[base]/settings-popover'
import { TokensMarquee } from '@/app/trade/[base]/tokens-marquee'

import { Button } from '@/components/ui/button'

export default function Page({ params }: { params: { base: string } }) {
  const layout = cookies().get('react-resizable-panels:layout')
  const side = cookies().get(STORAGE_SIDE)
  const isUSDCDenominated = cookies().get(STORAGE_USDC_DENOMINATED)

  let defaultLayout
  if (layout) {
    defaultLayout = JSON.parse(layout.value)
  }

  let defaultSide
  if (side) {
    defaultSide = side.value
  }

  let defaultUseUSDC = false
  if (isUSDCDenominated) {
    defaultUseUSDC = isUSDCDenominated.value === 'true'
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <PageClient
        defaultLayout={defaultLayout}
        base={params.base}
        side={defaultSide}
        isUSDCDenominated={defaultUseUSDC}
      />
      <div className="relative min-h-marquee overflow-hidden">
        <TokensMarquee />
        <SettingsPopover>
          <Button
            className="fixed bottom-20 right-0 min-h-marquee"
            variant="outline"
            size="icon"
          >
            <Ellipsis className="h-4 w-4 text-muted-foreground" />
          </Button>
        </SettingsPopover>
      </div>
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
