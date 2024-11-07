"use client"

import React from "react"

import { deleteCookie } from "@/app/actions"

import { STORAGE_STORE, STORAGE_REMEMBER_ME } from "@/lib/constants/storage"

export function ClearCookie() {
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const rememberMe = localStorage.getItem(STORAGE_REMEMBER_ME)
      if (rememberMe !== "true") {
        document.cookie = `${STORAGE_STORE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        deleteCookie(STORAGE_STORE)
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])
  return null
}
