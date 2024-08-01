import { useChainId, useConnections, useSwitchChain } from "wagmi"

export function useCheckChain() {
  const chainId = useChainId()
  const connections = useConnections()
  const { switchChainAsync } = useSwitchChain()
  const handleCheckChain = async () => {
    if (!connections[0]?.chainId) {
      // TODO: Open connect wallet modal
      return
    }
    if (chainId !== connections[0].chainId) {
      await switchChainAsync({
        chainId,
      })
    }
  }
  return { checkChain: handleCheckChain }
}
