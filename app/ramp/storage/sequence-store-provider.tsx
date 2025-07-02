"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

import { createSequenceStore, defaultSequenceState, type SequenceStore } from "./sequence-store";

type SequenceStoreApi = ReturnType<typeof createSequenceStore>;

const SequenceStoreContext = createContext<SequenceStoreApi | undefined>(undefined);

interface Props {
    children: ReactNode;
}

export function SequenceStoreProvider({ children }: Props) {
    const storeRef = useRef<SequenceStoreApi | null>(null);

    if (!storeRef.current) {
        storeRef.current = createSequenceStore(defaultSequenceState);
    }

    return (
        <SequenceStoreContext.Provider value={storeRef.current!}>
            {children}
        </SequenceStoreContext.Provider>
    );
}

export function useSequenceStore<T>(selector: (state: SequenceStore) => T): T {
    const store = useContext(SequenceStoreContext);
    if (!store) {
        throw new Error("useSequenceStore must be used within SequenceStoreProvider");
    }
    return useStore(store, selector);
}

// Direct access to the underlying zustand store (rarely needed)
export function useSequenceStoreApi() {
    const store = useContext(SequenceStoreContext);
    if (!store) {
        throw new Error("useSequenceStoreApi must be used within SequenceStoreProvider");
    }
    return store;
}
