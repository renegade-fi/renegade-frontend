export const MAINTENANCE_MESSAGES = {
    cancel: "Cancelling orders is temporarily disabled",
    default: "This action is temporarily disabled",
    place: "Placing orders is temporarily disabled",
    transfer: "Transfers are temporarily disabled",
} as const;

export type MaintenanceMessageKey = keyof typeof MAINTENANCE_MESSAGES;
