"use client";

import { useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useContext, useLayoutEffect, useRef } from "react";
import { useStore } from "zustand";
import { SEARCH_PARAM_CHAIN, STORAGE_SERVER_STORE } from "@/lib/constants/storage";
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage";
import {
    createServerStore,
    initServerStore,
    type ServerStore,
} from "@/providers/state-provider/server-store";

type ServerStoreApi = ReturnType<typeof createServerStore>;

const ServerStoreContext = createContext<ServerStoreApi | undefined>(undefined);

interface ServerStoreProviderProps {
    children: ReactNode;
    cookieString?: string;
}

export function ServerStoreProvider({ children, cookieString }: ServerStoreProviderProps) {
    const storeRef = useRef<ServerStoreApi>(undefined);
    const chainId = useSearchParams().get(SEARCH_PARAM_CHAIN);

    if (!storeRef.current) {
        const maybeInitialState = cookieToInitialState(STORAGE_SERVER_STORE, cookieString ?? "");
        const initialState = maybeInitialState ?? initServerStore(chainId);
        storeRef.current = createServerStore(initialState);
    }

    const active = useRef(true);

    useLayoutEffect(() => {
        (async () => {
            if (storeRef.current) {
                await storeRef.current.persist.rehydrate();
            }
        })();
        return () => {
            active.current = false;
        };
    }, []);

    return (
        <ServerStoreContext.Provider value={storeRef.current}>
            {children}
        </ServerStoreContext.Provider>
    );
}

export function useServerStore<T>(selector: (store: ServerStore) => T): T {
    const store = useContext(ServerStoreContext);

    if (!store) {
        throw new Error("useServerStore must be used within ServerStoreProvider");
    }

    return useStore(store, selector);
}
