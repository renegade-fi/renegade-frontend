"use client";

import { createContext, type ReactNode, useContext, useLayoutEffect, useRef } from "react";

import { useStore } from "zustand";

import {
    createServerStore,
    initServerStore,
    type ServerStore,
} from "@/providers/state-provider/server-store";

type ServerStoreApi = ReturnType<typeof createServerStore>;

const ServerStoreContext = createContext<ServerStoreApi | undefined>(undefined);

interface ServerStoreProviderProps {
    children: ReactNode;
}

export function ServerStoreProvider({ children }: ServerStoreProviderProps) {
    const storeRef = useRef<ServerStoreApi>(undefined);

    if (!storeRef.current) {
        storeRef.current = createServerStore(initServerStore());
    }

    const active = useRef(true);

    useLayoutEffect(() => {
        (async () => {
            if (storeRef.current) {
                console.log("[ServerStoreProvider] rehydrating");
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
