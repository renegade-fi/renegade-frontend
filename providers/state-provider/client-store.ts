import { createStorage } from "wagmi";
import { type PersistStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { STORAGE_CLIENT_STORE } from "@/lib/constants/storage";
import { getDefaultStorage } from "./cookie-storage";

// State that can be hydrated after initial render, as opposed to ServerState
type ClientState = {
    favorites: string[];
    lastVisitTs: string;
    viewedFills: string[];
};

type ClientActions = {
    setFavorites: (favorites: string[]) => void;
    setLastVisitTs: (lastVisitTs: string) => void;
    setViewedFills: (viewedFills: string[]) => void;
};

export type ClientStore = ClientState & ClientActions;

export const initClientStore = (): ClientState => {
    return defaultInitState;
};

const defaultInitState: ClientState = {
    favorites: [],
    lastVisitTs: "",
    viewedFills: [],
};

export const createClientStore = (initState: ClientState = defaultInitState) => {
    console.log("[ClientStore] creating store");
    return createStore<ClientStore>()(
        persist(
            (set) => ({
                ...initState,

                setFavorites: (favorites: string[]) => {
                    console.debug("[ClientStore] setFavorites called with:", favorites);
                    return set((_state) => ({ favorites }));
                },
                setLastVisitTs: (lastVisitTs: string) => {
                    console.debug("[ClientStore] setLastVisitTs called with:", lastVisitTs);
                    return set((_state) => ({ lastVisitTs }));
                },
                setViewedFills: (viewedFills: string[]) => {
                    console.debug("[ClientStore] setViewedFills called with:", viewedFills);
                    return set((_state) => ({ viewedFills }));
                },
            }),
            {
                name: STORAGE_CLIENT_STORE,
                skipHydration: true,
                storage: createStorage({
                    storage: getDefaultStorage(),
                    key: "trade",
                }) as PersistStorage<ClientState>,
            },
        ),
    );
};
