import { cookies } from "next/headers"

import { Token } from "@renegade-fi/react"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { prefetchPrice } from "@/app/actions"
import { PageClient } from "@/app/trade/[base]/page-client"

import { ScrollArea } from "@/components/ui/scroll-area"

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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScrollArea
        className="flex-grow"
        type="always"
      >
        <PageClient
          base={params.base}
          defaultLayout={defaultLayout}
          isUSDCDenominated={defaultUseUSDC}
          // TODO: Reenable favorites banner
          /* <div className="sticky bottom-20 hidden min-h-marquee overflow-hidden lg:block">
            <FavoritesBanner />
            </div> */
        />
      </ScrollArea>
    </HydrationBoundary>
  )
}
