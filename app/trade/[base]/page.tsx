import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { PageClient } from "@/app/trade/[base]/page-client"

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

  const base = await params.then(({ base }) => base)
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageClient base={base} />
    </HydrationBoundary>
  )
}
