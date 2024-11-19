"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"

import { useStore } from "zustand"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage"
import {
  createServerStore,
  initServerStore,
  type ServerStore,
} from "@/providers/state-provider/server-store"

export type ServerStoreApi = ReturnType<typeof createServerStore>

const ServerStoreContext = createContext<ServerStoreApi | undefined>(undefined)

export interface ServerStoreProviderProps {
  children: ReactNode
  cookieString?: string
}

export function ServerStoreProvider({
  children,
  cookieString,
}: ServerStoreProviderProps) {
  const storeRef = useRef<ServerStoreApi>(undefined)

  if (!storeRef.current) {
    const initialState = cookieToInitialState(
      STORAGE_SERVER_STORE,
      cookieString ?? "",
    )
    storeRef.current = createServerStore(initialState ?? initServerStore())
  }

  const active = useRef(true)

  useEffect(() => {
    ;(async () => {
      if (storeRef.current) {
        await storeRef.current.persist.rehydrate()
      }
    })()
    return () => {
      active.current = false
    }
  }, [])

  return (
    <ServerStoreContext.Provider value={storeRef.current}>
      {children}
    </ServerStoreContext.Provider>
  )
}

export function useServerStore<T>(selector: (store: ServerStore) => T): T {
  const store = useContext(ServerStoreContext)

  if (!store) {
    throw new Error("useServerStore must be used within ServerStoreProvider")
  }

  return useStore(store, selector)
}
