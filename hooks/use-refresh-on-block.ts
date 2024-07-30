import React from "react"

import { QueryKey, useQueryClient } from "@tanstack/react-query"
import { useBlockNumber } from "wagmi"

const N = BigInt(2)

export function useRefreshOnBlock({ queryKey }: { queryKey: QueryKey }) {
  const queryClient = useQueryClient()
  const { data } = useBlockNumber({ watch: true })

  React.useEffect(() => {
    if (data && data % N === BigInt(0)) {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [data, queryClient, queryKey])
}
