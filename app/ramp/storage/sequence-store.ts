import { deserialize, serialize } from "wagmi";
import { type PersistStorage, persist, type StorageValue } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { TransactionSequence } from "../transaction-control/internal/transaction-sequence";

// -------------------- Constants --------------------
const STORAGE_KEY = "ramp.sequence";

// -------------------- Types --------------------
/** State shape for sequence storage. */
export type SequenceState = {
    sequence: TransactionSequence | null;
};

/** Actions for managing sequence state. */
export type SequenceActions = {
    setSequence: (seq: TransactionSequence) => void;
    clear: () => void;
};

/** Complete store type combining state and actions. */
export type SequenceStore = SequenceState & SequenceActions;

// -------------------- Persist storage helper --------------------

const localStorageStorage: PersistStorage<SequenceStore> = {
    getItem: (name) => {
        if (typeof window === "undefined") return null;
        const raw = window.localStorage.getItem(name);
        if (raw === null) return null;
        try {
            const parsed = deserialize<StorageValue<SequenceStore>>(raw);
            // If a sequence exists, hydrate it back into class instance
            if (parsed.state.sequence) {
                parsed.state.sequence = TransactionSequence.from(parsed.state.sequence as any);
            }
            return parsed;
        } catch (err) {
            console.error("Failed to deserialize sequence store", err);
            return null;
        }
    },
    setItem: (name, value) => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(name, serialize(value));
        } catch (err) {
            console.error("Failed to serialize sequence store", err);
        }
    },
    removeItem: (name) => {
        if (typeof window === "undefined") return;
        window.localStorage.removeItem(name);
    },
};

// -------------------- Store factory --------------------

export const defaultSequenceState: SequenceState = {
    sequence: null,
};

/**
 * Create a Zustand store for persisting transaction sequences.
 */
export const createSequenceStore = (initState: SequenceState = defaultSequenceState) =>
    createStore<SequenceStore>()(
        persist(
            (set) => ({
                ...initState,
                setSequence: (sequence: TransactionSequence) => {
                    set({ sequence });
                },
                clear: () => {
                    set({ sequence: null });
                },
            }),
            {
                name: STORAGE_KEY,
                storage: localStorageStorage,
            },
        ),
    );
