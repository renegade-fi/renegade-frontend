import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { Token, UpdateType, useBalances } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { useForm, UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import {
  checkAmount,
  checkBalance,
  ExternalTransferDirection,
  formSchema,
  isMaxBalance,
} from "@/components/dialogs/transfer/helpers"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { NumberInput } from "@/components/number-input"
import { Button } from "@/components/ui/button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

import { useApprove } from "@/hooks/use-approve"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useWithdraw } from "@/hooks/use-withdraw"
import { MIN_DEPOSIT_AMOUNT, Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

export function DefaultForm({
  className,
  direction,
  form,
  onSuccess,
}: React.ComponentProps<"form"> & {
  direction: ExternalTransferDirection
  onSuccess: () => void
  form: UseFormReturn<z.infer<typeof formSchema>>
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const baseToken = mint
    ? Token.findByAddress(mint as `0x${string}`)
    : undefined
  const { address } = useAccount()
  const isMaxBalances = useIsMaxBalances(mint)

  const renegadeBalances = useBalances()
  const renegadeBalance = baseToken
    ? renegadeBalances.get(baseToken.address)?.amount
    : undefined

  const formattedRenegadeBalance = baseToken
    ? formatUnits(renegadeBalance ?? BigInt(0), baseToken.decimals)
    : ""
  const renegadeBalanceLabel = baseToken
    ? formatNumber(renegadeBalance ?? BigInt(0), baseToken.decimals, true)
    : ""

  const { data: l2Balance, queryKey } = useReadErc20BalanceOf({
    address: baseToken?.address,
    args: [address ?? "0x"],
    query: {
      enabled:
        direction === ExternalTransferDirection.Deposit &&
        !!baseToken &&
        !!address,
    },
  })

  useRefreshOnBlock({ queryKey })

  const formattedL2Balance = baseToken
    ? formatUnits(l2Balance ?? BigInt(0), baseToken.decimals)
    : ""
  const l2BalanceLabel = baseToken
    ? formatNumber(l2Balance ?? BigInt(0), baseToken.decimals, true)
    : ""

  const balance =
    direction === ExternalTransferDirection.Deposit
      ? formattedL2Balance
      : formattedRenegadeBalance
  const balanceLabel =
    direction === ExternalTransferDirection.Deposit
      ? l2BalanceLabel
      : renegadeBalanceLabel

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  const hideMaxButton =
    !mint || balance === "0" || amount.toString() === balance

  const { handleDeposit, status: depositStatus } = useDeposit({
    amount,
    mint,
  })

  const { handleWithdraw } = useWithdraw({
    amount,
    mint,
  })

  const {
    needsApproval,
    handleApprove,
    status: approveStatus,
  } = useApprove({
    amount: amount.toString(),
    mint,
    enabled: direction === ExternalTransferDirection.Deposit,
  })

  const { checkChain } = useCheckChain()

  let buttonText = ""
  if (direction === ExternalTransferDirection.Withdraw) {
    buttonText = "Withdraw"
  } else if (needsApproval) {
    if (approveStatus === "pending") {
      buttonText = "Confirm in wallet"
    } else {
      buttonText = "Approve & Deposit"
    }
  } else {
    if (depositStatus === "pending") {
      buttonText = "Confirm in wallet"
    } else {
      buttonText = "Deposit"
    }
  }
  const router = useRouter()
  const pathname = usePathname()
  const isTradePage = pathname.includes("/trade")
  const queryClient = useQueryClient()
  // Ensure price is loaded
  usePriceQuery(baseToken?.address || "0x")
  const { setSide } = useSide()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isAmountSufficient = checkAmount(
      queryClient,
      values.amount,
      baseToken,
    )

    if (direction === ExternalTransferDirection.Deposit) {
      if (!isAmountSufficient) {
        form.setError("amount", {
          message: `Amount must be greater than or equal to ${MIN_DEPOSIT_AMOUNT} USDC`,
        })
        return
      }
      await checkChain()
      const isBalanceSufficient = checkBalance({
        amount: values.amount,
        mint: values.mint,
        balance: l2Balance,
      })
      if (!isBalanceSufficient) {
        form.setError("amount", {
          message: "Insufficient Arbitrum balance",
        })
        return
      }
      if (needsApproval) {
        handleApprove({
          onSuccess: () => {
            handleDeposit({
              onSuccess: (data) => {
                form.reset()
                onSuccess?.()
                const message = constructStartToastMessage(UpdateType.Deposit)
                toast.loading(message, {
                  id: data.taskId,
                })
                setSide(baseToken?.ticker === "USDC" ? Side.BUY : Side.SELL)
                if (isTradePage && baseToken?.ticker !== "USDC") {
                  router.push(`/trade/${baseToken?.ticker}`)
                }
              },
            })
          },
        })
      } else {
        handleDeposit({
          onSuccess: (data) => {
            form.reset()
            onSuccess?.()
            const message = constructStartToastMessage(UpdateType.Deposit)
            toast.loading(message, {
              id: data.taskId,
            })
            setSide(baseToken?.ticker === "USDC" ? Side.BUY : Side.SELL)
            if (isTradePage && baseToken?.ticker !== "USDC") {
              router.push(`/trade/${baseToken?.ticker}`)
            }
          },
        })
      }
    } else {
      const renegadeBalance = renegadeBalances.get(
        values.mint as `0x${string}`,
      )?.amount
      // User is allowed to withdraw whole balance even if amount is < MIN_TRANSFER_AMOUNT
      if (
        !isAmountSufficient &&
        !isMaxBalance({
          amount: values.amount,
          mint: values.mint,
          balance: renegadeBalance,
        })
      ) {
        form.setError("amount", {
          message: `Amount must be greater than or equal to ${MIN_DEPOSIT_AMOUNT} USDC`,
        })
        return
      }
      // TODO: Check if balance is sufficient
      const isBalanceSufficient = checkBalance({
        amount: values.amount,
        mint: values.mint,
        balance: renegadeBalance,
      })
      if (!isBalanceSufficient) {
        form.setError("amount", {
          message: "Insufficient Renegade balance",
        })
        return
      }

      handleWithdraw({
        onSuccess: (data) => {
          form.reset()
          onSuccess?.()
        },
      })
    }
  }

  const { data: maintenanceMode } = useMaintenanceMode()

  return (
    <Form {...form}>
      <form
        className="flex flex-1 flex-col"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className={cn("space-y-8", className)}>
          <div className="grid w-full items-center gap-3">
            <FormField
              control={form.control}
              name="mint"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Token</FormLabel>
                  <TokenSelect
                    direction={direction}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full items-center gap-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <NumberInput
                        className={cn(
                          "w-full rounded-none pr-12 font-mono",
                          hideMaxButton ? "pr-12" : "",
                        )}
                        placeholder="0.00"
                        {...field}
                        value={field.value}
                      />
                      {!hideMaxButton && (
                        <Button
                          className="absolute right-2 top-1/2 h-7 -translate-y-1/2 text-muted-foreground"
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            field.onChange(balance, { shouldValidate: true })
                          }}
                        >
                          <span>MAX</span>
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {direction === ExternalTransferDirection.Deposit
                  ? "Arbitrum"
                  : "Renegade"}
                &nbsp;Balance
              </div>
              <Button
                className="h-5 p-0"
                type="button"
                variant="link"
                onClick={(e) => {
                  e.preventDefault()
                  form.setValue("amount", balance, {
                    shouldValidate: true,
                  })
                }}
              >
                <div className="font-mono text-sm">
                  {baseToken ? `${balanceLabel} ${baseToken.ticker}` : "--"}
                </div>
              </Button>
            </div>
            {direction === ExternalTransferDirection.Deposit && (
              <MaxBalancesWarning
                className="text-sm text-orange-400"
                mint={mint}
              />
            )}
          </div>
        </div>
        {isDesktop ? (
          <DialogFooter>
            <ResponsiveTooltip>
              <ResponsiveTooltipTrigger
                asChild
                className="!pointer-events-auto"
                type="submit"
              >
                <Button
                  className="flex-1 border-0 border-t font-extended text-2xl"
                  disabled={
                    !form.formState.isValid ||
                    (direction === ExternalTransferDirection.Deposit &&
                      isMaxBalances) ||
                    approveStatus === "pending" ||
                    depositStatus === "pending" ||
                    (maintenanceMode?.enabled &&
                      maintenanceMode.severity === "critical")
                  }
                  size="xl"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </ResponsiveTooltipTrigger>
              <ResponsiveTooltipContent
                className={
                  maintenanceMode?.enabled &&
                  maintenanceMode.severity === "critical"
                    ? "visible"
                    : "invisible"
                }
              >
                {`Transfers are temporarily disabled${maintenanceMode?.reason ? ` ${maintenanceMode.reason}` : ""}.`}
              </ResponsiveTooltipContent>
            </ResponsiveTooltip>
          </DialogFooter>
        ) : (
          <DialogFooter className="mt-auto flex-row">
            <DialogClose asChild>
              <Button
                className="flex-1 font-extended text-lg"
                size="xl"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
            <ResponsiveTooltip>
              <ResponsiveTooltipTrigger className="flex-1">
                <Button
                  className="w-full whitespace-normal border-l-0 font-extended text-lg"
                  disabled={
                    !form.formState.isValid ||
                    (direction === ExternalTransferDirection.Deposit &&
                      isMaxBalances) ||
                    approveStatus === "pending" ||
                    depositStatus === "pending" ||
                    (maintenanceMode?.enabled &&
                      maintenanceMode.severity === "critical")
                  }
                  size="xl"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </ResponsiveTooltipTrigger>
              <ResponsiveTooltipContent
                className={
                  maintenanceMode?.enabled &&
                  maintenanceMode.severity === "critical"
                    ? "visible"
                    : "invisible"
                }
              >
                {`Transfers are temporarily disabled${maintenanceMode?.reason ? ` ${maintenanceMode.reason}` : ""}.`}
              </ResponsiveTooltipContent>
            </ResponsiveTooltip>
          </DialogFooter>
        )}
      </form>
    </Form>
  )
}
