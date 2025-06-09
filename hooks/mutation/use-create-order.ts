import {
  createOrderRequest,
  CreateOrderRequestParameters,
  CreateOrderRequestReturnType,
} from "@renegade-fi/react/actions"
import { useMutation, UseMutationOptions } from "@tanstack/react-query"

import { useConfig } from "@/providers/renegade-provider/config-provider"

export function useCreateOrder(parameters?: {
  mutation?: Partial<
    UseMutationOptions<
      CreateOrderRequestReturnType,
      Error,
      CreateOrderRequestParameters
    >
  >
}) {
  const config = useConfig()
  return useMutation<
    CreateOrderRequestReturnType,
    Error,
    CreateOrderRequestParameters
  >({
    mutationKey: ["create-order"],
    mutationFn: async (variables) => {
      if (!config) throw new Error("No wallet found in storage")
      return createOrderRequest(config, variables)
    },
    ...parameters?.mutation,
  })
}
