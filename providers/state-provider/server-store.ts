import { CHAIN_IDS, ChainId } from "@renegade-fi/react/constants"
import { persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

import { Side } from "@/lib/constants/protocol"
import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { resolveTicker } from "@/lib/token"
import {
  cookieStorage,
  createStorage,
} from "@/providers/state-provider/cookie-storage"

import {
  CachedWallet,
  createEmptyWallet,
  ServerState,
  ServerStateSchema,
} from "./schema"

export type ServerActions = {
  setAmount: (amount: string) => void
  setBase: (baseMint: `0x${string}`) => void
  setChainId: (chainId: ChainId) => void
  setCurrency: (currency: "base" | "quote") => void
  setPanels: (layout: number[]) => void
  setQuote: (quoteMint: `0x${string}`) => void
  setSide: (side: Side) => void
  setWallet: (seed: `0x${string}`, id: string, chainId?: ChainId) => void
  resetWallet: (chainId?: ChainId) => void
  resetAllWallets: () => void
}

export type ServerStore = ServerState & ServerActions

const supportedChains = Object.values(CHAIN_IDS) as ChainId[]
const defaultWalletMap: Map<ChainId, CachedWallet> = new Map(
  supportedChains.map(
    (chainId) => [chainId, createEmptyWallet()] as [ChainId, CachedWallet],
  ),
)

const DEFAULT_CHAIN = supportedChains[0]
const WETH = resolveTicker("WETH")
const USDC = resolveTicker("USDC")

export const initServerStore = (): ServerState => {
  return defaultInitState
}

export const defaultInitState: ServerState = {
  chainId: DEFAULT_CHAIN,
  wallet: defaultWalletMap,
  order: {
    side: Side.BUY,
    amount: "",
    currency: "base",
  },
  baseMint: WETH.address,
  quoteMint: USDC.address,
  panels: { layout: [22, 78] },
}

export const createServerStore = (
  initState: ServerState = defaultInitState,
) => {
  let validatedState: ServerState
  const validationResult = validateState(initState)
  if (validationResult) {
    validatedState = initState
  } else {
    validatedState = defaultInitState
  }

  return createStore<ServerStore>()(
    persist(
      (set) => ({
        ...validatedState,
        setAmount: (amount: string) =>
          set((state) => ({ order: { ...state.order, amount } })),
        setBase: (baseMint: `0x${string}`) =>
          set(() => ({
            baseMint: baseMint.toLowerCase() as `0x${string}`,
          })),
        setChainId: (chainId: ChainId) => set(() => ({ chainId })),
        setCurrency: (currency: "base" | "quote") =>
          set((state) => ({ order: { ...state.order, currency } })),
        setPanels: (layout: number[]) => set(() => ({ panels: { layout } })),
        setQuote: (quoteMint: `0x${string}`) =>
          set(() => ({
            quoteMint: quoteMint.toLowerCase() as `0x${string}`,
          })),
        setSide: (side: Side) =>
          set((state) => ({ order: { ...state.order, side } })),
        setWallet: (seed: `0x${string}`, id: string, chainId?: ChainId) =>
          set((state) => ({
            wallet: new Map(state.wallet).set(chainId ?? state.chainId, {
              seed,
              id,
            }),
          })),
        resetWallet: (chainId?: ChainId) =>
          set((state) => ({
            wallet: new Map(state.wallet).set(
              chainId ?? state.chainId,
              createEmptyWallet(),
            ),
          })),
        resetAllWallets: () => set(() => ({ wallet: defaultWalletMap })),
      }),
      {
        name: STORAGE_SERVER_STORE,
        skipHydration: true,
        storage: createStorage(cookieStorage),
      },
    ),
  )
}

/**
 * Validates the state against the schema.
 */
function validateState(state: ServerState): boolean {
  const validationResult = ServerStateSchema.safeParse(state)
  return validationResult.success
}
