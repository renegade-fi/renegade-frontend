import * as React from "react"

import { TokenIcon } from "@/components/token-icon"

import { cn } from "@/lib/utils"
import {
  extractSupportedChain,
  getChainLogoTicker,
  getFormattedChainName,
} from "@/lib/viem"

interface NetworkDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  chainId: number
  showIcon?: boolean
  iconSize?: number
}

export function NetworkDisplay({
  chainId,
  showIcon = true,
  iconSize = 16,
  className,
  ...props
}: NetworkDisplayProps) {
  const _chain = extractSupportedChain(chainId)

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
