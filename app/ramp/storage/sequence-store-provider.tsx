"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

import { createSequenceStore, defaultSequenceState, type SequenceStore } from "./sequence-store";

type SequenceStoreApi = ReturnType<typeof createSequenceStore>;

const SequenceStoreContext = createContext<SequenceStoreApi | undefined>(undefined);

interface Props {
    children: ReactNode;
}

/**
 * Provider component for sequence store context.
 */
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

/**
 * Hook to access sequence store with a selector.
 */
export function useSequenceStore<T>(selector: (state: SequenceStore) => T): T {
    const store = useContext(SequenceStoreContext);
    if (!store) {
        throw new Error("useSequenceStore must be used within SequenceStoreProvider");
    }
    return useStore(store, selector);
}

/**
 * Hook to access the underlying Zustand store API directly.
 */
export function useSequenceStoreApi() {
    const store = useContext(SequenceStoreContext);
    if (!store) {
        throw new Error("useSequenceStoreApi must be used within SequenceStoreProvider");
    }
    return store;
}
