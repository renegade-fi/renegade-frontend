import { redirect } from "next/navigation"

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { PageClient } from "@/app/trade/[base]/page-client"

import { DISPLAY_TOKENS } from "@/lib/token"

import { getTickerRedirect, hydrateServerState } from "./utils"

export async function generateStaticParams() {
  const tokens = DISPLAY_TOKENS({ hideStables: true, hideHidden: true })
  return tokens.map((token) => ({
    base: token.ticker,
  }))
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ base: string }>
  searchParams: Promise<{ c?: string }>
}) {
  const baseTicker = (await params).base
  const chain = (await searchParams).c ?? undefined

  // Hydrate server-side state from cookies
  const serverState = await hydrateServerState()

  const resolvedTicker = getTickerRedirect(baseTicker, serverState)
  if (resolvedTicker) redirect(`/trade/${resolvedTicker}`)

  const queryClient = new QueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient
        base={baseTicker}
        chain={chain}
      />
    </HydrationBoundary>
  )
}
