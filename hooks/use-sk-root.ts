'use client'
import { Config, getSkRoot } from '@renegade-fi/react'

export type UseSkRootParameters = {
  config: Config
}

export type UseSkRootReturnType = `0x${string}`

export function useSkRoot(
  parameters: UseSkRootParameters,
): UseSkRootReturnType {
  const { config } = parameters
  const skRoot = getSkRoot(config)
  console.log('🚀 ~ skRoot:', skRoot)
  return skRoot
}
