"use client"

import React from "react"

import { useClientStore } from "@/providers/state-provider/client-store-provider.tsx"

export function TrackLastVisit() {
  const { setLastVisitTs } = useClientStore((state) => state)

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
