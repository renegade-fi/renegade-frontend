"use client"

import React from "react"

import { Cross2Icon } from "@radix-ui/react-icons"
import { useBackOfQueueWallet } from "@renegade-fi/react"
import { ArrowRight } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { Button } from "@/components/ui/button"

import { useMediaQuery } from "@/hooks/use-media-query"
import { STORAGE_DEPOSIT_BANNER } from "@/lib/constants/storage"

export function DepositBanner() {
  const [isClosed, setIsClosed] = useLocalStorage(STORAGE_DEPOSIT_BANNER, false)
  const [isVisible, setIsVisible] = React.useState(false)
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) => data.balances.length,
    },
  })
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  React.useEffect(() => {
    if (data === 0 && !isClosed) {
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [data, isClosed])

  if (isDesktop) {
    return (
      <div
        className={`transition-all duration-300 ease-in ${
          isVisible
            ? "max-h-20 opacity-100"
            : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <div className="flex w-full items-center border-b border-border bg-[#00183e] py-2 pl-4 text-sm text-blue lg:py-0">
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
            onClick={() => {
              setIsVisible(false)
              setTimeout(() => setIsClosed(true), 300)
            }}
          >
            <Cross2Icon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`transition-all duration-300 ease-in ${
        isVisible ? "max-h-20 opacity-100" : "max-h-0 overflow-hidden opacity-0"
      }`}
    >
      <div className="flex w-full items-center text-pretty border-b border-border bg-[#00183e] py-2 pl-4 pr-2 text-sm text-blue lg:py-0">
        <TransferDialog>
          <div>
            Welcome to Renegade! Deposit your Arbitrum tokens to get started.
          </div>
        </TransferDialog>
        <Button
          className="ml-auto"
          size="icon"
          variant="ghost"
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => setIsClosed(true), 300)
          }}
        >
          <Cross2Icon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </div>
  )
}
