import { cookies } from "next/headers"

import { Footer } from "@/app/components/footer"
import { Header } from "@/app/components/header"
import { FavoritesBanner } from "@/app/trade/[base]/components/favorites-banner"
import { PageClient } from "@/app/trade/[base]/page-client"

import { Side } from "@/lib/constants/protocol"
import {
  STORAGE_IS_USDC_DENOMINATED,
  STORAGE_SIDE,
} from "@/lib/constants/storage"
import { DISPLAY_TOKENS } from "@/lib/token"

export async function generateStaticParams() {
  const tokens = DISPLAY_TOKENS({ hideStables: true, hideHidden: true })
  return tokens.map((token) => ({
    base: token.ticker,
  }))
}

export default function Page({ params }: { params: { base: string } }) {
  const layout = cookies().get("react-resizable-panels:layout")
  const side = cookies().get(STORAGE_SIDE)
  const isUSDCDenominated = cookies().get(STORAGE_IS_USDC_DENOMINATED)

  let defaultLayout
  if (layout) {
    defaultLayout = JSON.parse(layout.value)
  }

  let defaultSide
  if (side) {
    defaultSide = side.value as Side
  }

  let defaultUseUSDC = false
  if (isUSDCDenominated) {
    defaultUseUSDC = isUSDCDenominated.value === "true"
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
      <div className="sticky bottom-20 min-h-marquee overflow-hidden">
        <FavoritesBanner />
      </div>
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
