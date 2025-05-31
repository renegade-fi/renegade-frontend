import { redirect } from "next/navigation"

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { PageClient } from "@/app/trade/[base]/page-client"

import { DISPLAY_TOKENS } from "@/lib/token"

import { hydrateServerState, resolveTokenParam } from "./utils"

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
  const baseParam = (await params).base

  // Hydrate server-side state from cookies
  const serverState = await hydrateServerState()
  const chainId = serverState.wallet.chainId

  // Resolve ticker or address to a valid token address
  const result = resolveTokenParam(baseParam, chainId, serverState)

  // Handle redirect if needed
  if ("redirect" in result) {
    redirect(result.redirect)
  }

  // Render with the resolved address
  const queryClient = new QueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient base={result.resolved} />
    </HydrationBoundary>
  )
}
