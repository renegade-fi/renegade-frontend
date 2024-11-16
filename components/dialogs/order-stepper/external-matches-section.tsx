import React from "react"

import { ExternalLink, Info, Zap } from "lucide-react"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"

import { PrivacySpeedSpectrum } from "./components/privacy-speed-spectrum"

export function ExternalMatchesSection(
  props: NewOrderConfirmationProps & {
    allowExternalMatches: boolean
    setAllowExternalMatches: (allowExternalMatches: boolean) => void
  },
) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleMouseEnter = () => {
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <div
          className="flex items-center justify-between border p-3 transition-colors hover:border-foreground"
          onClick={(e) => e.preventDefault()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="allow-external-matches">
                Allow external matches
              </Label>
              <a
                href={HELP_CENTER_ARTICLES.EXTERNAL_MATCHES.url}
                rel="noreferrer"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
              >
                <Info className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
              </a>
            </div>
            <div className="text-[0.8rem] text-muted-foreground">
              Get faster fills by matching with whitelisted solvers
            </div>
          </div>
          <Switch
            checked={props.allowExternalMatches}
            id="allow-external-matches"
            onCheckedChange={props.setAllowExternalMatches}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 space-y-2 rounded-none p-0 text-sm"
        side="right"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="grid h-20 place-items-center p-3">
          <PrivacySpeedSpectrum />
        </div>
        <Separator />
        <div className="space-y-2 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Zap className="h-5 w-5" />
            External matches
          </div>
          <div>
            {`By allowing external matches, you increase your pool of counterparties to include whitelisted solvers, which may result in a faster fill.`}
          </div>
          <div>
            {`External matches are less private than fully internal matches, due to the specifics of each executed match—such as the trading pair, side, and match size—being publicly visible on-chain.`}
          </div>
          <a
            className="inline-flex items-center underline-offset-4 transition-colors hover:text-foreground hover:underline hover:decoration-foreground"
            href={HELP_CENTER_ARTICLES.EXTERNAL_MATCHES.url}
            rel="noreferrer"
            target="_blank"
          >
            Learn more about the tradeoffs
            <ExternalLink className="ml-1 size-3" />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  )
}
