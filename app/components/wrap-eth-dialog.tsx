import React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { formatUnits } from "viem"
import { useAccount, useBalance } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { useWrapEth } from "@/hooks/use-wrap-eth"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { cn } from "@/lib/utils"

export function WrapEthDialog(props: React.PropsWithChildren) {
  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent
        hideCloseButton
        className="max-h-[80vh] gap-0 p-0 sm:max-w-[425px]"
        onPointerDownOutside={(e) => {
          // Prevent closing the dialog when clicking inside toast
          if (
            e.target instanceof Element &&
            e.target.closest("[data-sonner-toast]")
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <div className="flex flex-row border-b border-border">
            <Button
              className={cn("flex-1 border-0 font-extended text-lg font-bold")}
              size="xl"
              variant="outline"
            >
              Deposit
            </Button>
            <Button
              className={cn(
                "border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold",
              )}
              size="xl"
              variant="outline"
            >
              Withdraw
            </Button>
          </div>
          <VisuallyHidden>
            <DialogTitle>Wrap ETH</DialogTitle>
            <DialogDescription>Wrap ETH into WETH</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="p-4">
          <Content />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Content() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { data: ethBalance, queryKey: ethBalanceQueryKey } = useBalance({
    address,
  })
  const weth = Token.findByTicker("WETH")
  const { data: l2Balance, queryKey: wethBalanceQueryKey } =
    useReadErc20BalanceOf({
      address: weth?.address,
      args: [address ?? "0x"],
    })

  const [amount, setAmount] = React.useState("")
  const { wrapEth, status } = useWrapEth({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ethBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: wethBalanceQueryKey })
    },
    onError: (error) => {
      console.error("Error wrapping ETH:", error)
      // You can add error handling logic here, e.g., showing an error toast
    },
  })

  const onSubmit = () => {
    wrapEth(amount)
  }

  return (
    <>
      <div>
        <Input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div>
          <span>WETH Balance:&nbsp;</span>
          <span>
            {formatUnits(l2Balance ?? BigInt(0), weth?.decimals ?? 18)}
          </span>
        </div>
        <div>
          <span>{ethBalance?.symbol} Balance:&nbsp;</span>
          <span>
            {formatUnits(
              ethBalance?.value ?? BigInt(0),
              ethBalance?.decimals ?? 18,
            )}
          </span>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={status === "pending"}
          variant="ghost"
          onClick={onSubmit}
        >
          {status === "pending" ? "Confirm in wallet" : "Wrap"}
        </Button>
      </DialogFooter>
      {status === "success" && <div>Transaction confirmed!</div>}
    </>
  )
}
