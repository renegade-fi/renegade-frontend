import { redirect } from "next/navigation"

import { getFallbackTicker, hydrateServerState } from "./[base]/utils"

export default async function Page() {
  // Hydrate server-side state from cookies
  const serverState = await hydrateServerState()
  const ticker = getFallbackTicker(serverState)
  redirect(`/trade/${ticker}`)
}
