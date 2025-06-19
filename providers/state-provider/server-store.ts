import { CHAIN_IDS, type ChainId } from "@renegade-fi/react/constants";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { Side } from "@/lib/constants/protocol";
import { STORAGE_SERVER_STORE, STORAGE_VERSION } from "@/lib/constants/storage";
import { resolveTicker } from "@/lib/token";
import { cookieStorage, createStorage } from "@/providers/state-provider/cookie-storage";

import { AVAILABLE_CHAINS } from "../wagmi-provider/config";
import { type CachedWallet, createEmptyWallet, type ServerState } from "./schema";

export type ServerActions = {
    setAmount: (amount: string) => void;
    setBase: (baseMint: `0x${string}`) => void;
    setChainId: (chainId: ChainId) => void;
    setCurrency: (currency: "base" | "quote") => void;
    setPanels: (layout: number[]) => void;
    setQuote: (quoteMint: `0x${string}`) => void;
    setSide: (side: Side) => void;
    setWallet: (seed: `0x${string}`, id: string, chainId?: ChainId) => void;
    setRememberMe: (chainId: ChainId, remember: boolean) => void;
    setAllowExternalMatches: (allowExternalMatches: boolean) => void;
    resetWallet: (chainId?: ChainId) => void;
    resetAllWallets: () => void;
};

export type ServerStore = ServerState & ServerActions;

const supportedChains = Object.values(CHAIN_IDS) as ChainId[];
const defaultWalletMap: Map<ChainId, CachedWallet> = new Map(
    supportedChains.map((chainId) => [chainId, createEmptyWallet()] as [ChainId, CachedWallet]),
);

const defaultRememberMeMap: Map<ChainId, boolean> = new Map(
    supportedChains.map((chainId) => [chainId, false] as [ChainId, boolean]),
);

const DEFAULT_CHAIN = AVAILABLE_CHAINS[0].id;
const WETH = resolveTicker("WETH");
const USDC = resolveTicker("USDC");

export const initServerStore = (): ServerState => {
    return defaultInitState;
};

export const defaultInitState: ServerState = {
    chainId: DEFAULT_CHAIN,
    wallet: defaultWalletMap,
    rememberMe: defaultRememberMeMap,
    order: {
        side: Side.BUY,
        amount: "",
        currency: "base",
    },
    baseMint: WETH.address,
    quoteMint: USDC.address,
    allowExternalMatches: true,
    panels: { layout: [26, 74] },
};

export const createServerStore = (initState: ServerState = defaultInitState) => {
    return createStore<ServerStore>()(
        persist(
            (set) => ({
                ...initState,
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
                setSide: (side: Side) => set((state) => ({ order: { ...state.order, side } })),
                setWallet: (seed: `0x${string}`, id: string, chainId?: ChainId) =>
                    set((state) => ({
                        wallet: new Map(state.wallet).set(chainId ?? state.chainId, {
                            seed,
                            id,
                        }),
                    })),
                setRememberMe: (chainId: ChainId, remember: boolean) =>
                    set((state) => ({
                        rememberMe: new Map(state.rememberMe).set(chainId, remember),
                    })),
                setAllowExternalMatches: (allowExternalMatches: boolean) =>
                    set(() => ({ allowExternalMatches })),
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
                version: STORAGE_VERSION,
                migrate: (_: any, version: number): ServerState => {
                    console.log(
                        `Storage version mismatch detected. Stored: ${version}, Expected: ${STORAGE_VERSION}`,
                    );
                    console.log("Clearing user data and using default state");
                    return defaultInitState;
                },
                skipHydration: true,
                storage: createStorage(cookieStorage),
                partialize: (state) => {
                    // Reset wallets based on remember preferences
                    const filteredWallet = new Map();
                    for (const [chainId, walletData] of state.wallet) {
                        const persisted = state.rememberMe.get(chainId);
                        if (persisted) {
                            filteredWallet.set(chainId, walletData);
                        }
                    }

                    return {
                        ...state,
                        wallet: filteredWallet,
                    };
                },
            },
        ),
    );
};
