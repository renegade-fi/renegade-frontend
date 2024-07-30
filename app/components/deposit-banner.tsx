"use client"

import { useWallet } from "@renegade-fi/react"
import { ArrowRight } from "lucide-react"

import { TransferDialog } from "@/components/dialogs/transfer-dialog"
import { Button } from "@/components/ui/button"

export function DepositBanner() {
  const { data } = useWallet({
    query: {
      select: data => data.balances.length,
    },
  })
  if (data === 0) {
    return (
      <div className="w-full bg-blue pl-4 text-sm text-secondary">
        Welcome to Renegade! Deposit your Arbitrum tokens to get started
        trading.
        <TransferDialog>
          <Button className="text-secondary" variant="link">
            Deposit now
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </TransferDialog>
      </div>
    )
  }
  return null
}
