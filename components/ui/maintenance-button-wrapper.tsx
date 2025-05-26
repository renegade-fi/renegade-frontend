import * as React from "react"

import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  MAINTENANCE_MESSAGES,
  MaintenanceMessageKey,
} from "@/lib/constants/maintenance"
import { cn } from "@/lib/utils"
import { env } from "@/env/client"

interface MaintenanceButtonWrapperProps {
  children: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>
  messageKey?: MaintenanceMessageKey
  message?: string
  triggerClassName?: string
}

const isProduction = env.NEXT_PUBLIC_VERCEL_ENV === "production"

export function MaintenanceButtonWrapper({
  children,
  messageKey = "default",
  message,
  triggerClassName,
}: MaintenanceButtonWrapperProps) {
  const { data: maintenanceMode } = useMaintenanceMode()
  const isMobile = useIsMobile()

  const isCriticalMaintenance =
    isProduction &&
    maintenanceMode?.enabled &&
    maintenanceMode.severity === "critical"

  const maintenanceMessage = React.useMemo(() => {
    const baseMessage = message ?? MAINTENANCE_MESSAGES[messageKey]
    return `${baseMessage}${maintenanceMode?.reason ? ` ${maintenanceMode.reason}` : ""}.`
  }, [message, messageKey, maintenanceMode?.reason])

  const buttonWithMaintenance = React.cloneElement(children, {
    ...children.props,
    disabled: Boolean(children.props.disabled) || isCriticalMaintenance,
  } as React.ButtonHTMLAttributes<HTMLButtonElement>)

  return (
    <ResponsiveTooltip>
      <ResponsiveTooltipTrigger
        asChild={!isMobile}
        className={cn("!pointer-events-auto", triggerClassName)}
      >
        {buttonWithMaintenance}
      </ResponsiveTooltipTrigger>
      <ResponsiveTooltipContent
        className={isCriticalMaintenance ? "visible" : "invisible"}
      >
        {maintenanceMessage}
      </ResponsiveTooltipContent>
    </ResponsiveTooltip>
  )
}
