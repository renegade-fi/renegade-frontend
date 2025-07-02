"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { TransactionController } from "./controller";

export interface ControllerContextValue {
    controller: TransactionController;
}

const ControllerContext = createContext<ControllerContextValue | null>(null);

export function ControllerProvider({
    value,
    children,
}: {
    value: ControllerContextValue;
    children: ReactNode;
}) {
    return <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>;
}

export function useControllerContext(): ControllerContextValue {
    const ctx = useContext(ControllerContext);
    if (!ctx) {
        throw new Error("useControllerContext must be used within ControllerProvider");
    }
    return ctx;
}
