import { deserialize, serialize } from "wagmi";
import type { PersistStorage, StorageValue } from "zustand/middleware/persist";

import { STORAGE_VERSION } from "@/lib/constants/storage";
import { getCookie, removeCookie, setCookie } from "@/providers/state-provider/cookie-actions";
import type { ServerState } from "@/providers/state-provider/schema";

type BaseStorage = {
    getItem(key: string): string | null | undefined | Promise<string | null | undefined>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
};

export const cookieStorage: BaseStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            return await getCookie(name);
        } catch (err) {
            console.error("Error getting cookie:", err);
            return null;
        }
    },

    removeItem: async (name: string): Promise<void> => {
        try {
            await removeCookie(name);
        } catch (err) {
            console.error("Error removing cookie:", err);
        }
    },

    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await setCookie(name, value);
        } catch (err) {
            console.error("Error setting cookie:", err);
        }
    },
};

/**
 * Constructs a custom storage object for zustand persist that uses wagmi's serialize and deserialize functions,
 * allowing us to store `Map`s for type-safe wallet access. This is more so for ergonomics than out of necessity,
 * it may be removed in the future if it turns out to be a performance bottleneck.
 */
export function createStorage<T>(storage: BaseStorage): PersistStorage<T> {
    return {
        getItem: async (name: string): Promise<StorageValue<T> | null> => {
            const value = await storage.getItem(name);
            if (value === null) return null;
            if (!value) return null;
            return deserialize<{ state: T }>(value).state as StorageValue<T>;
        },
        removeItem: async (name: string): Promise<void> => {
            await storage.removeItem(name);
        },
        setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
            await storage.setItem(name, serialize(value));
        },
    };
}

function parseCookie(cookie: string, key: string) {
    const keyValue = cookie.split("; ").find((x) => x.startsWith(`${key}=`));
    if (!keyValue) return undefined;
    return keyValue.substring(key.length + 1);
}

export function cookieToInitialState(key: string, cookie?: string | null) {
    if (!cookie) return undefined;
    const parsed = parseCookie(decodeURIComponent(cookie), key);
    if (!parsed) return undefined;
    try {
        const deserialized = deserialize<{ state: ServerState; version?: number }>(parsed);

        // Check if this is old format data that needs migration
        if (!deserialized.version || deserialized.version < STORAGE_VERSION) {
            console.log(
                `Cookie contains old format data (version: ${deserialized.version || 0}). Using default state for SSR.`,
            );
            return undefined; // Let the store use default state, migration will happen during rehydration
        }

        return deserialized.state;
    } catch (err) {
        console.error("Error parsing cookie:", err);
        return undefined;
    }
}
