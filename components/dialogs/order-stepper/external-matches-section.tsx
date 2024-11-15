import { ExternalLink, Info, Zap } from "lucide-react"

import { AnimatedProgress } from "@/components/animated-progress"
import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"

export function ExternalMatchesSection(
  props: NewOrderConfirmationProps & {
    allowExternalMatches: boolean
    setAllowExternalMatches: (allowExternalMatches: boolean) => void
  },
) {
  return (
    <>
      <HoverCard
        closeDelay={0}
        openDelay={0}
      >
        <HoverCardTrigger className="cursor-pointer">
          <div
            className="flex cursor-pointer items-center justify-between border p-3 transition-colors hover:border-foreground"
            onClick={() =>
              props.setAllowExternalMatches(!props.allowExternalMatches)
            }
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label
                  className="cursor-pointer"
                  htmlFor="allow-external-matches"
                  onClick={(e) => e.stopPropagation()}
                >
                  Allow external matches
                </Label>
                <a
                  href={HELP_CENTER_ARTICLES.INDICATIONS_OF_INTEREST.url}
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
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  props.setAllowExternalMatches(checked)
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          className="space-y-2 rounded-none p-0 text-sm"
          side="right"
        >
          <>
            <div className="grid h-20 place-items-center p-3">
              <AnimatedProgress />
            </div>
            <Separator />
            <div className="space-y-2 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Zap className="h-5 w-5" />
                Get faster fills
              </div>
              <div className="">
                {`Enabling external matches exposes your order to more potential counterparties, increasing the chances of a faster fill.`}
              </div>
              <div className="">
                {`While the full details of your order remain private, the specifics of each executed match—such as the trading pair, side, and match size—become publicly visible on-chain.`}
              </div>
              <Button
                className="p-0"
                variant="link"
              >
                Learn more
                <ExternalLink className="ml-1 size-3" />
              </Button>
            </div>
          </>
        </HoverCardContent>
      </HoverCard>
    </>
  )
}
