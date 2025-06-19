export const MAINTENANCE_MESSAGES = {
    place: "Placing orders is temporarily disabled",
    cancel: "Cancelling orders is temporarily disabled",
    transfer: "Transfers are temporarily disabled",
    default: "This action is temporarily disabled",
} as const;

export type MaintenanceMessageKey = keyof typeof MAINTENANCE_MESSAGES;
