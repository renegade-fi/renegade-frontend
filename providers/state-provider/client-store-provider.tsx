"use client";

import { createContext, type ReactNode, useContext, useLayoutEffect, useRef } from "react";

import { useStore } from "zustand";

import {
    type ClientStore,
    createClientStore,
    initClientStore,
} from "@/providers/state-provider/client-store";

type ClientStoreApi = ReturnType<typeof createClientStore>;

const ClientStoreContext = createContext<ClientStoreApi | undefined>(undefined);

interface ClientStoreProviderProps {
    children: ReactNode;
}

export function ClientStoreProvider({ children }: ClientStoreProviderProps) {
    const storeRef = useRef<ClientStoreApi>(undefined);

    if (!storeRef.current) {
        storeRef.current = createClientStore(initClientStore());
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
        <ClientStoreContext.Provider value={storeRef.current}>
            {children}
        </ClientStoreContext.Provider>
    );
}

export function useClientStore<T>(selector: (store: ClientStore) => T): T {
    const store = useContext(ClientStoreContext);

    if (!store) {
        throw new Error("useClientStore must be used within ClientStoreProvider");
    }

    return useStore(store, selector);
}
