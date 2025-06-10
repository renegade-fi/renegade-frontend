import { CHAIN_IDS } from "@renegade-fi/react/constants"
import { persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import { STORAGE_CLIENT_STORE } from "@/lib/constants/storage"

// State that can be hydrated after initial render, as opposed to ServerState
export type ClientState = {
  rememberMe: Record<string, boolean>
  favorites: string[]
  lastVisitTs: string
  viewedFills: string[]
}

export type ClientActions = {
  setRememberMe: (chainId: number, remember: boolean) => void
  setFavorites: (favorites: string[]) => void
  setLastVisitTs: (lastVisitTs: string) => void
  setViewedFills: (viewedFills: string[]) => void
}

export type ClientStore = ClientState & ClientActions

const defaultRememberMe: Record<string, boolean> = Object.fromEntries(
  Object.values(CHAIN_IDS).map((chainId) => [chainId, false]),
)
// new Map(
//   supportedChains.map(
//     (chainId) => [chainId, createEmptyWallet()] as [ChainId, CachedWallet],
//   ),
// )

export const initClientStore = (): ClientState => {
  return defaultInitState
}

export const defaultInitState: ClientState = {
  rememberMe: defaultRememberMe,
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
        setRememberMe: (chainId: number, remember: boolean) =>
          set((state) => ({
            rememberMe: { ...state.rememberMe, [chainId]: remember },
          })),
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
