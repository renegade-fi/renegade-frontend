"use client"

import React from "react"

import { useAccount } from "wagmi"

import { fundList, fundWallet } from "@/lib/utils"
import { isTestnet, viemClient } from "@/lib/viem"

export function Faucet() {
  const { address, connector } = useAccount()
  // Fund on wallet change
  React.useEffect(() => {
    const handleFund = async () => {
      if (!address || !isTestnet) return
      const balance = await viemClient.getBalance({
        address,
      })
      if (!balance) {
        fundWallet(fundList, address)
      }
    }
    handleFund()
  }, [address])
  return null
}
