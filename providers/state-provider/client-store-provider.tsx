"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";

import { useStore } from "zustand";

import {
    type ClientStore,
    createClientStore,
    initClientStore,
} from "@/providers/state-provider/client-store";

export type ClientStoreApi = ReturnType<typeof createClientStore>;

const ClientStoreContext = createContext<ClientStoreApi | undefined>(undefined);

export interface ClientStoreProviderProps {
    children: ReactNode;
}

export function ClientStoreProvider({ children }: ClientStoreProviderProps) {
    const storeRef = useRef<ClientStoreApi>(undefined);

    if (!storeRef.current) {
        storeRef.current = createClientStore(initClientStore());
    }

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
