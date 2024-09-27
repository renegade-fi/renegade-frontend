import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { zodResolver } from "@hookform/resolvers/zod"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType, useBalances, usePayFees } from "@renegade-fi/react"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { NumberInput } from "@/components/number-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useFeeOnZeroBalance } from "@/hooks/use-fee-on-zero-balance"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useWithdraw } from "@/hooks/use-withdraw"
import { MIN_DEPOSIT_AMOUNT, Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { formatNumber, safeParseUnits } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { createPriceQueryKey } from "@/lib/query"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

const formSchema = z.object({
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .refine(
      (value) => {
        const num = parseFloat(value)
        return !isNaN(num) && num > 0
      },
      { message: "Amount must be greater than zero" },
    ),
  mint: z.string().min(1, {
    message: "Token is required",
  }),
})

export enum ExternalTransferDirection {
  Deposit,
  Withdraw,
}

export function TransferDialog({
  mint,
  children,
}: {
  mint?: `0x${string}`
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [direction, setDirection] = React.useState<ExternalTransferDirection>(
    ExternalTransferDirection.Deposit,
  )

  const { payFees } = usePayFees()
  const feeOnZeroBalance = useFeeOnZeroBalance()

  React.useEffect(() => {
    if (open && feeOnZeroBalance) {
      payFees()
    }
  }, [open, payFees, feeOnZeroBalance])

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
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
                className={cn(
                  "flex-1 border-0 font-extended text-lg font-bold",
                  direction === ExternalTransferDirection.Deposit
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                size="xl"
                variant="outline"
                onClick={() => setDirection(ExternalTransferDirection.Deposit)}
              >
                Deposit
              </Button>
              <Button
                className={cn(
                  "border-l-1 flex-1 border-y-0 border-r-0 font-extended text-lg font-bold",
                  direction === ExternalTransferDirection.Withdraw
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
                size="xl"
                variant="outline"
                onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
              >
                Withdraw
              </Button>
            </div>
            <VisuallyHidden>
              <DialogTitle>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit"
                  : "Withdraw"}
              </DialogTitle>
              <DialogDescription>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit tokens into Renegade"
                  : "Withdraw tokens from Renegade"}
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <TransferForm
            className="p-6"
            direction={direction}
            initialMint={mint}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-dvh p-0">
        <div className="flex flex-col">
          <DialogHeader className="">
            <VisuallyHidden>
              <DialogTitle>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit"
                  : "Withdraw"}
              </DialogTitle>
              <DialogDescription>
                {direction === ExternalTransferDirection.Deposit
                  ? "Deposit tokens into Renegade"
                  : "Withdraw tokens from Renegade"}
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <div className="mt-12 flex flex-row px-6 font-extended">
            <Button
              className={cn(
                "flex-1 text-lg tracking-tight",
                direction === ExternalTransferDirection.Deposit
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              size="xl"
              variant="outline"
              onClick={() => setDirection(ExternalTransferDirection.Deposit)}
            >
              Deposit
            </Button>
            <Button
              className={cn(
                "flex-1 border-l-0 text-lg tracking-tight",
                direction === ExternalTransferDirection.Withdraw
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              size="xl"
              variant="outline"
              onClick={() => setDirection(ExternalTransferDirection.Withdraw)}
            >
              Withdraw
            </Button>
          </div>
          <TransferForm
            className="p-6"
            direction={direction}
            initialMint={mint}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TransferForm({
  className,
  direction,
  initialMint,
  onSuccess,
}: React.ComponentProps<"form"> & {
  direction: ExternalTransferDirection
  initialMint?: string
  onSuccess: () => void
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      mint: initialMint ?? "",
    },
  })

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
                toast.success(message, {
                  id: data.taskId,
                  icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
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
            toast.success(message, {
              id: data.taskId,
              icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
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
          <DialogFooter className="mt-auto flex-row p-6">
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
                  className="w-full !border-l-0 font-extended text-lg"
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

// Return true if the amount is greater than or equal to the minimum deposit amount (1 USDC)
function checkAmount(
  queryClient: QueryClient,
  amount: string,
  baseToken?: Token,
) {
  if (!baseToken) return false
  const usdPrice = queryClient.getQueryData<number>(
    createPriceQueryKey("binance", baseToken.address),
  )
  if (!usdPrice) return false
  const amountInUsd = Number(amount) * usdPrice
  return amountInUsd >= MIN_DEPOSIT_AMOUNT
}

// Returns true if the amount is less than or equal to the balance
// Returns false if the amount is greater than the balance or if the amount is invalid
function checkBalance({
  amount,
  mint,
  balance,
}: z.infer<typeof formSchema> & { balance?: bigint }) {
  if (!balance) {
    return false
  }
  try {
    const token = Token.findByAddress(mint as `0x${string}`)
    const parsedAmount = safeParseUnits(amount, token.decimals)
    if (parsedAmount instanceof Error) {
      return false
    }
    return parsedAmount <= balance
  } catch (error) {
    return false
  }
}

// Returns true iff the amount is equal to the balance
function isMaxBalance({
  amount,
  mint,
  balance,
}: z.infer<typeof formSchema> & { balance?: bigint }) {
  if (!balance) {
    return false
  }
  try {
    const token = Token.findByAddress(mint as `0x${string}`)
    const formattedAmount = formatUnits(balance, token.decimals)
    return amount === formattedAmount
  } catch (error) {
    return false
  }
}
