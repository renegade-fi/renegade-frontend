import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"

import { PageClient } from "@/app/assets/page-client"
import { Footer } from "@/app/components/footer"
import { Header } from "@/app/components/header"

export default async function Page() {
  const queryClient = new QueryClient()

  // await Promise.all(
  //   DISPLAY_TOKENS().map((token) => prefetchPrice(queryClient, token.address)),
  // )

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <div className="min-h-20">
        <Header />
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PageClient />
      </HydrationBoundary>
      <div className="min-h-20">
        <Footer />
      </div>
    </div>
  )
}
