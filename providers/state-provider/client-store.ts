import { persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import { STORAGE_CLIENT_STORE } from "@/lib/constants/storage"

// State that can be hydrated after initial render, as opposed to ServerState
export type ClientState = {
  favorites: string[]
  lastVisitTs: string
  viewedFills: string[]
}

export type ClientActions = {
  setFavorites: (favorites: string[]) => void
  setLastVisitTs: (lastVisitTs: string) => void
  setViewedFills: (viewedFills: string[]) => void
}

export type ClientStore = ClientState & ClientActions

export const initClientStore = (): ClientState => {
  return defaultInitState
}

export const defaultInitState: ClientState = {
  favorites: [],
  lastVisitTs: "",
  viewedFills: [],
}

export const createClientStore = (
  initState: ClientState = defaultInitState,
) => {
  return createStore<ClientStore>()(
    persist(
      (set) => ({
        ...initState,

        setFavorites: (favorites: string[]) => set((state) => ({ favorites })),
        setLastVisitTs: (lastVisitTs: string) =>
          set((state) => ({ lastVisitTs })),
        setViewedFills: (viewedFills: string[]) =>
          set((state) => ({ viewedFills })),
      }),
      {
        name: STORAGE_CLIENT_STORE,
      },
    ),
  )
}
