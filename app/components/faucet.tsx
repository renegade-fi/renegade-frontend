"use client"

import React from "react"

import { useAccount, usePublicClient } from "wagmi"

import { useChain } from "@/hooks/use-chain"
import { useIsBase } from "@/hooks/use-is-base"
import { fundList, fundWallet } from "@/lib/utils"
import { isTestnet } from "@/lib/viem"

export function Faucet() {
  const { address } = useAccount()
  const chainId = useChain()?.id
  const publicClient = usePublicClient()
  const isBase = useIsBase()
  // Fund on wallet change
  React.useEffect(() => {
    const handleFund = async () => {
      if (!address || !isTestnet || isBase) return
      const balance = await publicClient?.getBalance({
        address,
      })
      if (!balance) {
        fundWallet(fundList, address, chainId)
      }
    }
    handleFund()
  }, [address, chainId, publicClient, isBase])
  return null
}
