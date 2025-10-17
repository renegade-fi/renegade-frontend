/**
 * Shared constants for TWAP functionality
 */

export const DURATION_PRESETS = [
    { hours: 0, label: "1 min", minutes: 1 },
    { hours: 0, label: "5 min", minutes: 5 },
    { hours: 0, label: "15 min", minutes: 15 },
    { hours: 1, label: "1 hour", minutes: 0 },
    { hours: 4, label: "4 hours", minutes: 0 },
    { hours: 12, label: "12 hours", minutes: 0 },
    { hours: 24, label: "24 hours", minutes: 0 },
] as const;
