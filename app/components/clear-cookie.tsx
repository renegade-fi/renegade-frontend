"use client"

import { useEffect, useRef } from "react"

import { ChainId } from "@renegade-fi/react/constants"
import { serialize } from "wagmi"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { useClientStore } from "@/providers/state-provider/client-store-provider"
import {
  createEmptyWallet,
  type ServerState,
} from "@/providers/state-provider/schema"
import { defaultInitState } from "@/providers/state-provider/server-store"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

export function ClearCookie() {
  const { rememberMe } = useClientStore((state) => state)
  const serverState = useServerStore((s) => s)
  const newState = useRef<ServerState>(defaultInitState)

  useEffect(() => {
    const newWallet = new Map(serverState.wallet)
    for (const [cid, keep] of Object.entries(rememberMe)) {
      if (!keep)
        newWallet.set(Number.parseInt(cid) as ChainId, createEmptyWallet())
    }
    newState.current = { ...serverState, wallet: newWallet }
    console.log("state after reload: ", newState.current)
  }, [serverState, rememberMe])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const serialized = serialize({ state: newState.current })
      const isProduction = process.env.NODE_ENV === "production"
      const secureFlag = isProduction ? " secure;" : ""
      document.cookie = `${STORAGE_SERVER_STORE}=${serialized}; path=/;${secureFlag} samesite=strict`
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  return null
}
