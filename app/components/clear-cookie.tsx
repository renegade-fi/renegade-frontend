"use client"

import React from "react"

import { STORAGE_STORE } from "@/lib/constants/storage"
import { useClientStore } from "@/providers/state-provider/client-store-provider.tsx"
import { removeCookie } from "@/providers/state-provider/cookie-actions"

export function ClearCookie() {
  const { rememberMe } = useClientStore((state) => state)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      if (!rememberMe) {
        document.cookie = `${STORAGE_STORE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        removeCookie(STORAGE_STORE)
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [rememberMe])
  return null
}
