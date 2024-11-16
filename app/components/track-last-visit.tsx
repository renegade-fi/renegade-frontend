"use client"

import React from "react"

import { useLocalStorage } from "usehooks-ts"

import { STORAGE_LAST_VISIT } from "@/lib/constants/storage"

export function useLastVisit() {
  const [lastVisitTs, setLastVisitTs] = useLocalStorage<number>(
    STORAGE_LAST_VISIT,
    Date.now(),
    {
      initializeWithValue: false,
    },
  )
  return { lastVisitTs, setLastVisitTs }
}

export function TrackLastVisit() {
  const { setLastVisitTs } = useLastVisit()

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      setLastVisitTs(Date.now())
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [setLastVisitTs])

  return null
}
