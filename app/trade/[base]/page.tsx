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

import { resolveTokenParam } from "./utils"

/**
 * Hydrates server state from cookies
 */
export async function hydrateServerState(): Promise<ServerState> {
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
  const baseParam = (await params).base

  // Hydrate server-side state from cookies
  const serverState = await hydrateServerState()

  // Resolve ticker or address to a valid token address
  const result = resolveTokenParam(baseParam, serverState)

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
