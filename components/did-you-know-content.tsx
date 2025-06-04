import React, { useMemo } from "react"

import { Repeat } from "lucide-react"

import { Button } from "@/components/ui/button"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"
import { resolveAddress } from "@/lib/token"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function DidYouKnowContent() {
  const baseMint = useServerStore((state) => state.baseMint)
  const baseToken = resolveAddress(baseMint)
  const canonicalExchange =
    baseToken.canonicalExchange.charAt(0).toUpperCase() +
    baseToken.canonicalExchange.slice(1)

  const DID_YOU_KNOW_CONTENT = useMemo(
    () =>
      [
        {
          text: "All trades are pre-trade and post-trade private.",
          link: HELP_CENTER_ARTICLES.PRIVACY.url,
        },
        {
          text: `All trades clear at the midpoint of the ${canonicalExchange} bid-ask spread.`,
          link: HELP_CENTER_ARTICLES.MIDPOINT_PRICING.url,
        },
        {
          text: "Trading in Renegade has zero MEV, slippage, or price impact.",
          link: HELP_CENTER_ARTICLES.ZERO_MEV.url,
        },
      ] as const,
    [canonicalExchange],
  )

  const [randomContent, setRandomContent] = React.useState(() => {
    const randomIndex = Math.floor(Math.random() * DID_YOU_KNOW_CONTENT.length)
    return DID_YOU_KNOW_CONTENT[randomIndex]
  })
  const handleRefresh = () => {
    let newIndex: number
    do {
      newIndex = Math.floor(Math.random() * DID_YOU_KNOW_CONTENT.length)
    } while (DID_YOU_KNOW_CONTENT[newIndex] === randomContent)
    setRandomContent(DID_YOU_KNOW_CONTENT[newIndex])
  }

  return (
    <>
      <div className="space-y-2 border p-4 pt-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          Did you know?
          <Button
            className="rounded-none"
            size="icon"
            variant="ghost"
            onClick={handleRefresh}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
        <a
          className="text-pretty underline-offset-4 hover:underline"
          href={randomContent.link}
          rel="noreferrer"
          target="_blank"
        >
          {randomContent.text}
        </a>
      </div>
    </>
  )
}
