import { Token } from "@renegade-fi/token-nextjs"

import { zeroAddress } from "@/lib/token"
import { useCurrentChain } from "@/providers/state-provider/hooks"

/**
 * Returns true if the active pair's chain and the renegade wallet chain are not equal
 */
export function useNeedsSwitch(base: `0x${string}`) {
  const chainId = useCurrentChain()
  if (!chainId) return false
  // If base on chain exists in the remap, then we don't need to switch
  const token = Token.fromAddressOnChain(base, chainId)
  return token.address === zeroAddress
}
