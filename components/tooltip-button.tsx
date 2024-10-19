import React from "react"

import { Button, ButtonProps } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipButtonProps extends ButtonProps {
  tooltipContent: React.ReactNode
  href?: string
  onClick?: () => void
}

export function TooltipButton({
  children,
  tooltipContent,
  href,
  onClick,
  ...buttonProps
}: TooltipButtonProps) {
  const ButtonComponent = href ? (
    <Button
      asChild
      type="button"
      {...buttonProps}
    >
      <a
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    </Button>
  ) : (
    <Button
      type="button"
      onClick={onClick}
      {...buttonProps}
    >
      {children}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{ButtonComponent}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  )
}
