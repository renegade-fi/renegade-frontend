import React from "react";

import { type Config, useWaitForTransactionReceipt } from "wagmi";

import { CONFIRMATIONS } from "@/lib/constants/protocol";

export function useTransactionConfirmation(
    hash?: `0x${string}`,
    onConfirm?: () => void,
    config?: Config,
) {
    const { isSuccess, status } = useWaitForTransactionReceipt({
        config,
        hash,
        confirmations: CONFIRMATIONS,
    });

    const [isConfirmationHandled, setIsConfirmationHandled] = React.useState(false);

    React.useEffect(() => {
        if (isSuccess && hash && !isConfirmationHandled) {
            onConfirm?.();
            setIsConfirmationHandled(true);
        }
    }, [hash, isSuccess, onConfirm, isConfirmationHandled]);

    // If hash changes, should run onConfirm
    React.useEffect(() => {
        setIsConfirmationHandled(false);
    }, []);

    return status;
}
