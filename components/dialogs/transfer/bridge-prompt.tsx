import { Token } from "@renegade-fi/react"
import { ExternalLink } from "lucide-react"

import { constructArbitrumBridgeUrl } from "@/components/dialogs/transfer/helpers"
import { TokenIcon } from "@/components/token-icon"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

export function BridgePrompt({
  token,
  formattedL1Balance,
}: {
  token?: Token
  formattedL1Balance: string
}) {
  if (!token) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className={cn(
            "group flex justify-between gap-4 border p-3 transition-colors hover:cursor-pointer hover:border-primary",
          )}
          href={constructArbitrumBridgeUrl(formattedL1Balance, token.address)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="space-y-0.5">
            <Label className="text-base">Arbitrum Bridge</Label>
            <div className="text-[0.8rem] text-muted-foreground">
              {`Bridge ${token.ticker} to Arbitrum to deposit`}
            </div>
          </div>
          <div className="flex flex-1 justify-end">
            <ExternalLink className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        Renegade only supports deposits on the Arbitrum network
      </TooltipContent>
    </Tooltip>
  )
}
