import { Token } from "@renegade-fi/react"
import { ExternalLink } from "lucide-react"

import { constructArbitrumBridgeUrl } from "@/components/dialogs/transfer/helpers"
import { TokenIcon } from "@/components/token-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

export function BridgePrompt({
  baseToken,
  formattedL1Balance,
}: {
  baseToken?: Token
  formattedL1Balance: string
}) {
  if (!baseToken) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className={cn(
            "group flex gap-4 border p-4 transition-colors hover:cursor-pointer hover:border-primary",
          )}
          href={constructArbitrumBridgeUrl(formattedL1Balance)}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="self-center">
            <TokenIcon
              size={36}
              ticker="ARB"
            />
          </div>
          <div>
            <div className="text-xl font-medium">Arbitrum Bridge</div>
            <div className="text-sm text-muted-foreground">
              Bridge tokens to Arbitrum One
            </div>
          </div>
          <div className="flex flex-1 justify-end">
            <ExternalLink className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        {`To deposit into Renegade, you must first bridge
                your ${baseToken.ticker} to Arbitrum`}
      </TooltipContent>
    </Tooltip>
  )
}
