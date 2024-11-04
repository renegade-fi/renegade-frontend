import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { PageClient } from "@/app/assets/page-client"

import { ScrollArea } from "@/components/ui/scroll-area"

export default async function Page() {
  const queryClient = new QueryClient()

  // await Promise.all(
  //   DISPLAY_TOKENS().map((token) => prefetchPrice(queryClient, token.address)),
  // )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ScrollArea
        className="flex-grow"
        type="always"
      >
        <PageClient />
      </ScrollArea>
    </HydrationBoundary>
  )
}
