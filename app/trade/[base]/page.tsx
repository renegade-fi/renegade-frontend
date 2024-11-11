import { cookies } from "next/headers"

import { Token } from "@renegade-fi/react"
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { PageClient } from "@/app/trade/[base]/page-client"

import { STORAGE_IS_USDC_DENOMINATED } from "@/lib/constants/storage"
import { DISPLAY_TOKENS } from "@/lib/token"

export async function generateStaticParams() {
  const tokens = DISPLAY_TOKENS({ hideStables: true, hideHidden: true })
  return tokens.map((token) => ({
    base: token.ticker,
  }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ base: string }>
}) {
  const queryClient = new QueryClient()

  const [[base, mint], { layout, denomination }] = await Promise.all([
    params.then(
      ({ base }) =>
        [base, Token.findByTicker(base.toUpperCase()).address] as const,
    ),
    cookies().then((store) => ({
      layout: store.get("react-resizable-panels:layout"),
      denomination: store.get(STORAGE_IS_USDC_DENOMINATED),
    })),
  ])

  // Parse user preferences with defaults
  const defaultLayout = layout?.value ? JSON.parse(layout.value) : undefined
  const isUSDCDenominated = denomination?.value === "true"

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient
        base={base}
        defaultLayout={defaultLayout}
        isUSDCDenominated={isUSDCDenominated}
      />
    </HydrationBoundary>
  )
}
