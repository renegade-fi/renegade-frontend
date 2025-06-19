import {
    type CreateOrderRequestParameters,
    type CreateOrderRequestReturnType,
    createOrderRequest,
} from "@renegade-fi/react/actions";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";

import { useConfig } from "@/providers/state-provider/hooks";

export function useCreateOrder(parameters?: {
    mutation?: Partial<
        UseMutationOptions<CreateOrderRequestReturnType, Error, CreateOrderRequestParameters>
    >;
}) {
    const config = useConfig();
    return useMutation<CreateOrderRequestReturnType, Error, CreateOrderRequestParameters>({
        mutationKey: ["create-order"],
        mutationFn: async (variables) => {
            if (!config) throw new Error("No wallet found in storage");
            return createOrderRequest(config, variables);
        },
        ...parameters?.mutation,
    });
}
