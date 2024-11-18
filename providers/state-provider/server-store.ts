// src/stores/counter-store.ts
import { createJSONStorage, persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import { Side } from "@/lib/constants/protocol"
import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { createCookieStorage } from "@/providers/state-provider/cookie-storage"

// State that must be available during Server Component rendering

export type ServerState = {
  order: {
    side: Side
    amount: string
    currency: "base" | "quote"
    base: string
  }
}

export type ServerActions = {
  setSide: (side: Side) => void
  setAmount: (amount: string) => void
  setCurrency: (currency: "base" | "quote") => void
  setBase: (base: string) => void
}

export type ServerStore = ServerState & ServerActions

export const initServerStore = (): ServerState => {
  return {
    order: { side: Side.BUY, amount: "100", currency: "base", base: "SOL" },
  }
}

export const defaultInitState: ServerState = {
  order: { side: Side.BUY, amount: "100", currency: "base", base: "SOL" },
}

export const createServerStore = (
  initState: ServerState = defaultInitState,
) => {
  return createStore<ServerStore>()(
    persist(
      (set) => ({
        ...initState,
        setSide: (side: Side) =>
          set((state) => ({ order: { ...state.order, side } })),
        setAmount: (amount: string) =>
          set((state) => ({ order: { ...state.order, amount } })),
        setCurrency: (currency: "base" | "quote") =>
          set((state) => ({ order: { ...state.order, currency } })),
        setBase: (base: string) =>
          set((state) => ({ order: { ...state.order, base } })),
      }),
      {
        name: STORAGE_SERVER_STORE,
        storage: createJSONStorage(() => createCookieStorage()),
        // Optional: Add custom serialization/deserialization
        partialize: (state) => ({
          order: state.order,
        }),
      },
    ),
  )
}
