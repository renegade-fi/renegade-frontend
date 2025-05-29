import * as React from "react"

import { TokenIcon } from "@/components/token-icon"

import { cn } from "@/lib/utils"
import { getChainLogoTicker, getFormattedChainName } from "@/lib/viem"

interface NetworkLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  chainId: number | undefined
  showIcon?: boolean
  iconSize?: number
}

export function NetworkLabel({
  chainId,
  showIcon = true,
  iconSize = 16,
  className,
  ...props
}: NetworkLabelProps) {
  if (!chainId) {
    return null
  }
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {showIcon && (
        <TokenIcon
          size={iconSize}
          ticker={getChainLogoTicker(chainId)}
        />
      )}
      {getFormattedChainName(chainId)}
    </div>
  )
}
