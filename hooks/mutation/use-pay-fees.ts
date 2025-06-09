import { payFees } from "@renegade-fi/react/actions"
import { useMutation } from "@tanstack/react-query"

import { useConfig } from "@/providers/renegade-provider/config-provider"

export function usePayFees() {
  const config = useConfig()
  return useMutation({
    mutationKey: ["pay-fees"],
    mutationFn: async () => {
      if (!config) throw new Error("No wallet found in storage")
      return payFees(config)
    },
  })
}
