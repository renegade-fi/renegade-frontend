"use client"

import React, { useEffect, useState } from "react"

import { AlertCircle, AlertTriangle, Info } from "lucide-react"

import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"

export function MaintenanceBanner() {
  const { data: maintenanceMode, isLoading } = useMaintenanceMode()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isLoading && maintenanceMode?.enabled) {
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [isLoading, maintenanceMode?.enabled])

  const getBgColor = () => {
    switch (maintenanceMode?.severity) {
      case "critical":
        return "bg-[#2A1700]"
      case "warning":
        return ""
      default:
        return ""
    }
  }

  const getTextColor = () => {
    switch (maintenanceMode?.severity) {
      case "critical":
        return "text-orange-500"
      case "warning":
        return "text-yellow"
      default:
        return "text-blue"
    }
  }

  const getIcon = () => {
    switch (maintenanceMode?.severity) {
      case "critical":
        return AlertCircle
      case "warning":
        return AlertTriangle
      default:
        return Info
    }
  }

  const bannerContent = (
    <div
      className={`flex w-full items-center border-b border-border ${getBgColor()} px-4 py-2 text-sm ${getTextColor()}`}
    >
      {React.createElement(getIcon(), {
        className: "mr-2 min-h-4 min-w-4 max-h-4 max-w-4",
      })}
      <div className="text-pretty">{maintenanceMode?.bannerMessage}</div>
    </div>
  )

  return (
    <div
      className={`transition-all duration-300 ease-in ${
        isVisible ? "max-h-20 opacity-100" : "max-h-0 overflow-hidden opacity-0"
      }`}
    >
      {bannerContent}
    </div>
  )
}
