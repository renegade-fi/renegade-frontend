import React from "react"

import { Repeat } from "lucide-react"

import { Button } from "@/components/ui/button"

const DID_YOU_KNOW_CONTENT = [
  {
    text: "All trades are pre-trade and post-trade private.",
    link: "https://help.renegade.fi/hc/en-us/articles/32760870056723-What-is-pre-trade-and-post-trade-privacy",
  },
  {
    text: "All trades clear at the midpoint of the Binance bid-ask spread.",
    link: "https://help.renegade.fi/hc/en-us/articles/32530574872211-What-is-a-midpoint-peg",
  },
  {
    text: "Trading in Renegade has zero MEV, slippage, or price impact.",
    link: "https://help.renegade.fi/hc/en-us/articles/32762213393043-Does-Renegade-really-have-zero-MEV-copy-trading-slippage-or-price-impact",
  },
] as const

export function DidYouKnowContent() {
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
      {/* <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Checkbox id="donot-show-again" />
        <label
          htmlFor="donot-show-again"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Don&apos;t show again
        </label>
      </div> */}
    </>
  )
}
