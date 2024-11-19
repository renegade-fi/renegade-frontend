import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

export function BridgePromptEthereum({
  onClick,
  hasBalance,
}: {
  onClick: () => void
  hasBalance: boolean
}) {
  const content = (
    <div
      className={cn(
        "text-pretty border p-3 text-muted-foreground transition-colors",
        {
          "cursor-pointer hover:border-primary hover:text-primary": hasBalance,
        },
      )}
      onClick={onClick}
    >
      <div className="space-y-0.5">
        <div className="text-sm font-medium">
          Bridge and deposit from Ethereum with 1-click.
        </div>
        <div className="text-[0.8rem]">Powered by Across</div>
      </div>
    </div>
  )

  if (hasBalance) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>You need balance on Ethereum to bridge.</TooltipContent>
    </Tooltip>
  )
}
