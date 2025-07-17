import {
    type CancelOrderRequestParameters,
    type CancelOrderRequestReturnType,
    cancelOrderRequest,
} from "@renegade-fi/react/actions";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { useConfig } from "@/providers/state-provider/hooks";

export function useCancelOrder(parameters?: {
    mutation?: Partial<
        UseMutationOptions<CancelOrderRequestReturnType, Error, CancelOrderRequestParameters>
    >;
}) {
    const config = useConfig();
    return useMutation<CancelOrderRequestReturnType, Error, CancelOrderRequestParameters>({
        mutationFn: async (variables) => {
            if (!config) throw new Error("No wallet found in storage");
            return cancelOrderRequest(config, variables);
        },
        mutationKey: ["cancel-order"],
        ...parameters?.mutation,
    });
}
