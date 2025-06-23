import { toast } from "sonner";
import { BaseError } from "viem";

export const catchErrorWithToast = (error: Error, message?: string) => {
    if (error instanceof BaseError) {
        toast.error(`${message ? `${message}: ` : ""}${error.shortMessage || error.message}`);
    } else {
        toast.error(`${message ? `${message}: ` : ""}${error.message}`);
    }
};
