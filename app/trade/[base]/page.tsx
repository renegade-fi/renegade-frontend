import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"

import { PageClient } from "@/app/trade/[base]/page-client"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { DISPLAY_TOKENS } from "@/lib/token"
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage"
import {
  defaultInitState,
  ServerState,
} from "@/providers/state-provider/server-store"

import { getTickerRedirect } from "./utils"

/**
 * Hydrates server state from cookies
 */
async function hydrateServerState(): Promise<ServerState> {
  const headersList = await headers()
  const cookieString = headersList.get("cookie")
    ? decodeURIComponent(headersList.get("cookie") ?? "")
    : ""
  const initialState =
    cookieToInitialState(STORAGE_SERVER_STORE, cookieString) ?? defaultInitState
  return initialState
}

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
  const baseTicker = (await params).base

  // Hydrate server-side state from cookies
  const serverState = await hydrateServerState()

  const resolvedTicker = getTickerRedirect(baseTicker, serverState)
  if (resolvedTicker) redirect(`/trade/${resolvedTicker}`)

  const queryClient = new QueryClient()
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient base={baseTicker} />
    </HydrationBoundary>
  )
}
