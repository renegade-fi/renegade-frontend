import React from "react";

import { useWaitForTransactionReceipt } from "wagmi";

import { CONFIRMATIONS } from "@/lib/constants/protocol";

export function useTransactionConfirmation(
    hash?: `0x${string}`,
    onConfirm?: () => void,
    chainId?: number,
) {
    const { isSuccess, status } = useWaitForTransactionReceipt({
        chainId,
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
