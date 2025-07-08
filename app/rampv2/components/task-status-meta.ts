// app/rampv2/components/task-status-meta.ts

import { Check, Loader2, X } from "lucide-react";
import type { ComponentType } from "react";

// Canonicalised set of lifecycle states that the UI cares about.
export type CanonicalTaskState = "Pending" | "Running" | "Completed" | "Error";

interface StatusMeta {
    icon?: ComponentType<{ className?: string }>;
    iconClass?: string;
    showSpinner?: boolean;
}

// Central lookup: maps the canonical state to UI metadata.  Extend this when
// new canonical states are introduced.
export const STATUS_META: Record<CanonicalTaskState, StatusMeta> = {
    Pending: {
        // No icon for yet-to-start tasks
    },
    Running: {
        icon: Loader2,
        showSpinner: true,
    },
    Completed: {
        icon: Check,
        iconClass: "text-green-500",
    },
    Error: {
        icon: X,
        iconClass: "text-red-500",
    },
};

/**
 * Convert arbitrary task label strings into one of the canonical UI states.
 * Falls back to "Running" for any in-progress states we don't explicitly know.
 */
export function toCanonicalState(label: string): CanonicalTaskState {
    if (label === "Pending") return "Pending";
    if (label === "Completed") return "Completed";
    if (label === "Error") return "Error";
    return "Running";
}
