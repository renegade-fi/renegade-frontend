"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { TransactionController } from "./controller";

/** Context value shape for controller access. */
export interface ControllerContextValue {
    controller: TransactionController;
}

const ControllerContext = createContext<ControllerContextValue | null>(null);

/**
 * Provider component for transaction controller context.
 */
export function ControllerProvider({
    value,
    children,
}: {
    value: ControllerContextValue;
    children: ReactNode;
}) {
    return <ControllerContext.Provider value={value}>{children}</ControllerContext.Provider>;
}

/**
 * Hook to access the transaction controller from context.
 */
export function useControllerContext(): ControllerContextValue {
    const ctx = useContext(ControllerContext);
    if (!ctx) {
        throw new Error("useControllerContext must be used within ControllerProvider");
    }
    return ctx;
}
