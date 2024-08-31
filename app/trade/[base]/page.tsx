import { cookies } from "next/headers"

import { Token } from "@renegade-fi/react"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { prefetchPrice } from "@/app/actions"
import { Footer } from "@/app/components/footer"
import { Header } from "@/app/components/header"
import { FavoritesBanner } from "@/app/trade/[base]/components/favorites-banner"
import { PageClient } from "@/app/trade/[base]/page-client"

import { EXCHANGES, Side } from "@/lib/constants/protocol"
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

export default async function Page({ params }: { params: { base: string } }) {
  const queryClient = new QueryClient()
  const baseToken = Token.findByTicker(params.base.toUpperCase())
  const baseMint = baseToken.address

  const [, cookieData] = await Promise.all([
    Promise.all(
      // TODO: [PERFORMANCE] Price reporter prefetch disabled due to slow response times
      [prefetchPrice(queryClient, baseMint, "binance")],
    ),
    Promise.all([
      cookies().get("react-resizable-panels:layout"),
      cookies().get(STORAGE_SIDE),
      cookies().get(STORAGE_IS_USDC_DENOMINATED),
    ]),
  ])

  const [layout, side, isUSDCDenominated] = cookieData

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultSide = side ? (side.value as Side) : undefined
  const defaultUseUSDC = isUSDCDenominated
    ? isUSDCDenominated.value === "true"
    : false

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PageClient
          defaultLayout={defaultLayout}
          base={params.base}
          side={defaultSide}
          isUSDCDenominated={defaultUseUSDC}
        />
      </HydrationBoundary>
      <div className="sticky bottom-20 min-h-marquee overflow-hidden">
        <FavoritesBanner />
      </div>
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
