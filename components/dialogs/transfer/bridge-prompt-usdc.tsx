import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

export function BridgePromptUSDC({
  onClick,
  hasUSDC,
}: {
  onClick: () => void
  hasUSDC: boolean
}) {
  const content = (
    <div
      className={cn(
        "text-pretty border p-3 text-muted-foreground transition-colors",
        {
          "cursor-pointer hover:border-primary hover:text-primary": hasUSDC,
        },
      )}
      onClick={onClick}
    >
      <div className="space-y-0.5">
        <div className="text-sm font-medium">
          Bridge and deposit USDC from Ethereum with 1-click.
        </div>
        <div className="text-[0.8rem]">{`Powered by Across`}</div>
      </div>
    </div>
  )

  if (hasUSDC) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>You need USDC on Ethereum to bridge.</TooltipContent>
    </Tooltip>
  )
}
