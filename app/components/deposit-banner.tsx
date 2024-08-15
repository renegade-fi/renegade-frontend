"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { useWallet } from "@renegade-fi/react"
import { ArrowRight } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"

import { STORAGE_DEPOSIT_BANNER } from "@/lib/constants/storage"

export function DepositBanner() {
  const [isClosed, setIsClosed] = useLocalStorage(STORAGE_DEPOSIT_BANNER, false)
  const { data } = useWallet({
    query: {
      select: (data) => data.balances.length,
    },
  })
  if (data === 0 && !isClosed) {
    return (
      <div className="flex w-full items-center border-b border-border bg-[#00183e] pl-4 text-sm text-blue">
        <div>
          Welcome to Renegade! Deposit your Arbitrum tokens to get started.
        </div>
        <TransferDialog>
          <Button
            className="text-blue"
            variant="link"
          >
            Deposit now
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </TransferDialog>
        <Button
          className="ml-auto"
          size="icon"
          variant="ghost"
          onClick={() => setIsClosed(true)}
        >
          <Cross2Icon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    )
  }
}
