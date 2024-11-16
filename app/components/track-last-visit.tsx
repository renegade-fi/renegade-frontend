"use client"

import { useEffect } from "react"

import { useLocalStorage } from "usehooks-ts"

import { STORAGE_LAST_VISIT } from "@/lib/constants/storage"

export function useLastVisit() {
  const [lastVisit, setLastVisit] = useLocalStorage<number>(
    STORAGE_LAST_VISIT,
    Date.now(),
    {
      initializeWithValue: false,
    },
  )
  return { lastVisit, setLastVisit }
}

export function TrackLastVisit() {
  const { setLastVisit } = useLastVisit()

  useEffect(() => {
    const handleBeforeUnload = () => {
      //   setLastVisit(Date.now())
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [setLastVisit])

  return null
}
