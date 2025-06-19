"use client"

import React from "react"

import { useClientStore } from "@/providers/state-provider/client-store-provider"

export function TrackLastVisit() {
  const setLastVisitTs = useClientStore((s) => s.setLastVisitTs)

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      setLastVisitTs(Date.now().toString())
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [setLastVisitTs])

  return null
}
