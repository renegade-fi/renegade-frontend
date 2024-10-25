import { Info } from "lucide-react"

import { NewOrderConfirmationProps } from "@/components/dialogs/order-stepper/desktop/new-order-stepper"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"

export function IOISection(
  props: NewOrderConfirmationProps & {
    allowExternalMatches: boolean
    setAllowExternalMatches: (allowExternalMatches: boolean) => void
  },
) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="font-extended text-lg font-semibold leading-none tracking-tight">
            Indications of Interest
          </div>
          <div className="text-sm text-muted-foreground">
            Broadcast intents to the network
          </div>
        </div>
        <a
          href={HELP_CENTER_ARTICLES.INDICATIONS_OF_INTEREST.url}
          rel="noreferrer"
          target="_blank"
        >
          <Info className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
        </a>
      </div>
      <div className="items-top flex">
        <Checkbox
          checked={props.allowExternalMatches}
          id="allow-external-matches"
          onCheckedChange={(checked) => {
            if (typeof checked === "boolean") {
              props.setAllowExternalMatches(checked)
            }
          }}
        />
        <div className="space-y-1 leading-none">
          <Label
            className="pl-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            htmlFor="allow-external-matches"
          >
            External Matches
          </Label>
          <div className="pl-2 text-[0.8rem] text-muted-foreground">
            Allow third-party solvers to settle matches
          </div>
        </div>
      </div>
      {props.allowExternalMatches ? (
        <div className="space-y-4">
          <Separator />
          <div className="text-sm text-muted-foreground">
            Revealing: Pair, Side, Size
          </div>
        </div>
      ) : null}
    </>
  )
}
