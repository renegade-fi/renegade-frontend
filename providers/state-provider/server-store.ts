import { ChainId } from "@renegade-fi/react/constants"
import { createJSONStorage, persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import { Side } from "@/lib/constants/protocol"
import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { resolveTicker } from "@/lib/token"
import { createCookieStorage } from "@/providers/state-provider/cookie-storage"

// State that must be available during Server Component rendering
export type ServerState = {
  wallet: {
    seed: `0x${string}` | undefined
    chainId: ChainId | undefined
    id: string | undefined
  }
  order: {
    side: Side
    amount: string
    currency: "base" | "quote"
    baseMint: `0x${string}`
    quoteMint: `0x${string}`
  }
  panels: {
    layout: number[]
  }
}

export type ServerActions = {
  setSide: (side: Side) => void
  setAmount: (amount: string) => void
  setCurrency: (currency: "base" | "quote") => void
  setBase: (baseMint: `0x${string}`) => void
  setPanels: (layout: number[]) => void
  setWallet: (seed: `0x${string}`, chainId: ChainId, id: string) => void
  resetWallet: () => void
}

export type ServerStore = ServerState & ServerActions

const WETH = resolveTicker("WETH")
const USDC = resolveTicker("USDC")
export const initServerStore = (): ServerState => {
  return {
    wallet: {
      seed: undefined,
      chainId: undefined,
      id: undefined,
    },
    order: {
      side: Side.BUY,
      amount: "",
      currency: "base",
      baseMint: WETH.address,
      quoteMint: USDC.address,
    },
    panels: { layout: [22, 78] },
  }
}

export const defaultInitState: ServerState = {
  wallet: {
    seed: undefined,
    chainId: undefined,
    id: undefined,
  },
  order: {
    side: Side.BUY,
    amount: "",
    currency: "base",
    baseMint: WETH.address,
    quoteMint: USDC.address,
  },
  panels: { layout: [22, 78] },
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
        setBase: (baseMint: `0x${string}`) =>
          set((state) => ({
            order: {
              ...state.order,
              baseMint: baseMint.toLowerCase() as `0x${string}`,
            },
          })),
        setPanels: (layout: number[]) =>
          set((state) => ({ panels: { layout } })),
        setWallet: (seed: `0x${string}`, chainId: ChainId, id: string) =>
          set((state) => ({ wallet: { ...state.wallet, seed, chainId, id } })),
        resetWallet: () =>
          set((state) => ({
            wallet: {
              ...state.wallet,
              seed: undefined,
              chainId: undefined,
              id: undefined,
            },
          })),
      }),
      {
        name: STORAGE_SERVER_STORE,
        skipHydration: true,
        storage: createJSONStorage(() => createCookieStorage()),
      },
    ),
  )
}
