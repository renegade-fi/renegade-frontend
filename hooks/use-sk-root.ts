"use client"

import { Config } from "@renegade-fi/react"
import { getSkRoot } from "@renegade-fi/react/actions"

export type UseSkRootParameters = {
  config: Config
}

export type UseSkRootReturnType = `0x${string}`

export function useSkRoot(
  parameters: UseSkRootParameters,
): UseSkRootReturnType {
  const { config } = parameters
  const skRoot = getSkRoot(config)
  return skRoot
}
