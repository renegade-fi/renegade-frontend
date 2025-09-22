import { isSupportedChainId } from "@renegade-fi/react";
import { CHAIN_IDS, type ChainId } from "@renegade-fi/react/constants";
import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { Side } from "@/lib/constants/protocol";
import { STORAGE_SERVER_STORE, STORAGE_VERSION } from "@/lib/constants/storage";
import { resolveTicker } from "@/lib/token";
import { cookieStorage, createStorage } from "@/providers/state-provider/cookie-storage";
import { AVAILABLE_CHAINS } from "../wagmi-provider/config";
import { type CachedWallet, createEmptyWallet, type ServerState } from "./schema";

type ServerActions = {
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

export const initServerStore = (chainId: string | null): ServerState => {
    if (chainId && isSupportedChainId(Number.parseInt(chainId, 10 /* radix */) as ChainId)) {
        return {
            ...defaultInitState,
            chainId: Number.parseInt(chainId, 10 /* radix */) as ChainId,
        };
    }
    return defaultInitState;
};

export const defaultInitState: ServerState = {
    allowExternalMatches: true,
    baseMint: WETH.address,
    chainId: DEFAULT_CHAIN,
    order: {
        amount: "",
        currency: "base",
        side: Side.BUY,
    },
    panels: { layout: [26, 74] },
    quoteMint: USDC.address,
    rememberMe: defaultRememberMeMap,
    wallet: defaultWalletMap,
};

export const createServerStore = (initState: ServerState) => {
    console.log("[ServerStore] creating store", initState);
    return createStore<ServerStore>()(
        persist(
            (set) => ({
                ...initState,
                resetAllWallets: () => {
                    console.log("[ServerStore] resetAllWallets");
                    return set(() => ({ wallet: defaultWalletMap }));
                },
                resetWallet: (chainId?: ChainId) => {
                    console.log("[ServerStore] resetWallet", chainId);
                    return set((state) => ({
                        wallet: new Map(state.wallet).set(
                            chainId ?? state.chainId,
                            createEmptyWallet(),
                        ),
                    }));
                },
                setAllowExternalMatches: (allowExternalMatches: boolean) => {
                    console.log("[ServerStore] setAllowExternalMatches", allowExternalMatches);
                    return set(() => ({ allowExternalMatches }));
                },
                setAmount: (amount: string) => {
                    console.log("[ServerStore] setAmount", amount);
                    return set((state) => ({ order: { ...state.order, amount } }));
                },
                setBase: (baseMint: `0x${string}`) => {
                    console.log("[ServerStore] setBase", baseMint);
                    return set(() => ({
                        baseMint: baseMint.toLowerCase() as `0x${string}`,
                    }));
                },
                setChainId: (chainId: ChainId) => {
                    console.trace("[ServerStore] setChainId", chainId);
                    return set(() => ({ chainId }));
                },
                setCurrency: (currency: "base" | "quote") => {
                    console.log("[ServerStore] setCurrency", currency);
                    return set((state) => ({ order: { ...state.order, currency } }));
                },
                setPanels: (layout: number[]) => {
                    console.log("[ServerStore] setPanels", layout);
                    return set(() => ({ panels: { layout } }));
                },
                setQuote: (quoteMint: `0x${string}`) => {
                    console.log("[ServerStore] setQuote", quoteMint);
                    return set(() => ({
                        quoteMint: quoteMint.toLowerCase() as `0x${string}`,
                    }));
                },
                setRememberMe: (chainId: ChainId, remember: boolean) => {
                    console.log("[ServerStore] setRememberMe", { chainId, remember });
                    return set((state) => ({
                        rememberMe: new Map(state.rememberMe).set(chainId, remember),
                    }));
                },
                setSide: (side: Side) => {
                    console.log("[ServerStore] setSide", side);
                    return set((state) => ({ order: { ...state.order, side } }));
                },
                setWallet: (seed: `0x${string}`, id: string, chainId?: ChainId) => {
                    console.log("[ServerStore] setWallet", { chainId, id, seed });
                    return set((state) => ({
                        wallet: new Map(state.wallet).set(chainId ?? state.chainId, {
                            id,
                            seed,
                        }),
                    }));
                },
            }),
            {
                migrate: (_: any, version: number): ServerState => {
                    console.log(
                        `Storage version mismatch detected. Stored: ${version}, Expected: ${STORAGE_VERSION}`,
                    );
                    console.log("Clearing user data and using default state");
                    return defaultInitState;
                },
                name: STORAGE_SERVER_STORE,
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
                skipHydration: true,
                storage: createStorage(cookieStorage),
                version: STORAGE_VERSION,
            },
        ),
    );
};
