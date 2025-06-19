///////////////////
// Create Wallet //
///////////////////
import { toast } from "sonner";
import { BaseError } from "viem";

export const CREATE_WALLET_START = "Creating new Renegade wallet...";
export const CREATE_WALLET_SUCCESS = "Successfully created your new Renegade wallet.";
export const CREATE_WALLET_ERROR = "Failed to create wallet. Please try again.";

///////////////////
// Lookup Wallet //
///////////////////

export const LOOKUP_WALLET_START = "Syncing wallet with on-chain state...";
export const LOOKUP_WALLET_SUCCESS = "Successfully synced wallet with on-chain state.";
export const LOOKUP_WALLET_ERROR = "Failed to sync wallet. Please try again.";

export const catchErrorWithToast = (error: Error, message?: string) => {
    if (error instanceof BaseError) {
        toast.error(`${message ? `${message}: ` : ""}${error.shortMessage || error.message}`);
    } else {
        toast.error(`${message ? `${message}: ` : ""}${error.message}`);
    }
};
