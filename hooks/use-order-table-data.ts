import { useOrderHistory } from "@renegade-fi/react"

export function useOrderTableData() {
  const { data } = useOrderHistory({
    query: {
      select: (data) => Array.from(data?.values() || []),
    },
  })
  return data || []
}
