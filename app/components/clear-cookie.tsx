"use client"

import React from "react"

import { STORAGE_STORE, STORAGE_REMEMBER_ME } from "@/lib/constants/storage"
import { removeCookie } from "@/providers/state-provider/cookie-actions"

export function ClearCookie() {
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const rememberMe = localStorage.getItem(STORAGE_REMEMBER_ME)
      if (rememberMe !== "true") {
        document.cookie = `${STORAGE_STORE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        removeCookie(STORAGE_STORE)
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])
  return null
}
