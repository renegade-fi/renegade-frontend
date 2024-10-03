import * as React from "react"

import { Token, UpdateType } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatUnits, parseEther, parseUnits } from "viem"
import { useAccount, useSendTransaction } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import {
  ExternalTransferDirection,
  checkAmount,
  checkBalance,
  formSchema,
} from "@/components/dialogs/transfer/helpers"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { useSwapQuote } from "@/components/dialogs/transfer/use-swap-quote"
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

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useBasePerQuotePrice } from "@/hooks/use-base-per-usd-price"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useTransactionConfirmation } from "@/hooks/use-transaction-confirmation"
import { MAX_INT, MIN_DEPOSIT_AMOUNT, Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { catchErrorWithToast } from "@/lib/constants/toast"
import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf, useWriteErc20Approve } from "@/lib/generated"
import { ADDITIONAL_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

const USDCE = ADDITIONAL_TOKENS["USDC.e"]

// Assume direction is deposit and mint is WETH
export function USDCForm({
  className,
  form,
  onSuccess,
}: React.ComponentProps<"form"> & {
  onSuccess: () => void
  form: UseFormReturn<z.infer<typeof formSchema>>
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { data: maintenanceMode } = useMaintenanceMode()
  const { checkChain } = useCheckChain()
  const queryClient = useQueryClient()
  const { setSide } = useSide()
  const [totalSteps, setTotalSteps] = React.useState(0)
  const [currentStep, setCurrentStep] = React.useState(0)

  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  const baseToken = Token.findByTicker("USDC")
  const { address } = useAccount()
  const isMaxBalances = useIsMaxBalances(mint)
  // Ensure price is loaded
  usePriceQuery(baseToken.address)

  const { data: usdcBalance, queryKey: usdcBalanceQueryKey } =
    useReadErc20BalanceOf({
      address: baseToken.address,
      args: [address ?? "0x"],
    })

  useRefreshOnBlock({ queryKey: usdcBalanceQueryKey })

  const formattedUsdcBalance = formatUnits(
    usdcBalance ?? BigInt(0),
    baseToken.decimals,
  )
  const usdcBalanceLabel = formatNumber(
    usdcBalance ?? BigInt(0),
    baseToken.decimals,
    true,
  )

  // USDC.e-specific logic
  const { data: usdceBalance, queryKey: usdceBalanceQueryKey } =
    useReadErc20BalanceOf({
      address: USDCE.address,
      args: [address ?? "0x"],
    })
  const formattedUsdceBalance = formatUnits(
    usdceBalance ?? BigInt(0),
    USDCE.decimals,
  )
  const usdceBalanceLabel = formatNumber(
    usdceBalance ?? BigInt(0),
    USDCE.decimals,
    true,
  )
  const basePerQuotePrice = useBasePerQuotePrice(baseToken.address)

  const combinedBalance =
    (usdcBalance ?? BigInt(0)) + (usdceBalance ?? BigInt(0))
  const formattedCombinedBalance = formatUnits(
    combinedBalance ?? BigInt(0),
    baseToken.decimals,
  )

  const remainingUsdceBalance =
    parseEther(amount) > (usdcBalance ?? BigInt(0))
      ? combinedBalance - parseUnits(amount, baseToken.decimals)
      : usdceBalance ?? BigInt(0)

  // If the amount is greater than the USDC balance, we need to swap USDCe
  const needsSwap =
    parseUnits(amount, baseToken.decimals) > (usdcBalance ?? BigInt(0))

  const amountToSwap = parseFloat(amount) - parseFloat(formattedUsdcBalance)
  const quote = useSwapQuote({
    fromMint: USDCE.address,
    toMint: baseToken.address,
    amount: amountToSwap.toFixed(6),
  })

  const { data: needsSwapApproval, queryKey: swapAllowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint: USDCE.address,
      spender: quote?.estimate.approvalAddress,
      decimals: USDCE.decimals,
    })

  const catchError = (error: Error, message: string) => {
    console.error("Error in USDC form", error)
    catchErrorWithToast(error, message)
    // Reset steps on error
    setTotalSteps(0)
    setCurrentStep(0)
  }

  const { writeContract: handleSwapApprove, status: swapApproveStatus } =
    useWriteErc20Approve({
      mutation: {
        onError: (error) => catchError(error, "Couldn't approve swap"),
      },
    })

  const { setTransactionHash: setSwapApproveHash } = useTransactionConfirmation(
    async () => {
      queryClient.invalidateQueries({ queryKey: swapAllowanceQueryKey })
      await handleSwap(
        // @ts-ignore
        {
          // TODO: Maybe unsafe
          ...quote?.transactionRequest,
          type: "legacy",
        },
        {
          onSuccess: (data) => setSwapHash(data),
        },
      )
    },
  )

  const { data: needsApproval, queryKey: usdcAllowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: baseToken.decimals,
    })

  const { writeContract: handleApprove, status: approveStatus } =
    useWriteErc20Approve({
      mutation: {
        onError: (error) => catchError(error, "Couldn't approve deposit"),
      },
    })

  const { setTransactionHash: setApproveHash } = useTransactionConfirmation(
    async () => {
      queryClient.invalidateQueries({ queryKey: usdcAllowanceQueryKey }),
        setCurrentStep((prev) => prev + 1)
      handleDeposit({
        onSuccess: handleDepositSuccess,
      })
    },
  )

  const { handleDeposit, status: depositStatus } = useDeposit({
    amount: needsSwap
      ? formatUnits(
          BigInt(quote?.estimate.toAmountMin ?? 0) + (usdcBalance ?? BigInt(0)),
          baseToken.decimals,
        )
      : amount,
    mint,
  })

  const { sendTransaction: handleSwap, status: swapStatus } =
    useSendTransaction({
      mutation: {
        onError: (error) => catchError(error, "Couldn't swap"),
      },
    })

  const { setTransactionHash: setSwapHash } = useTransactionConfirmation(
    async () => {
      queryClient.invalidateQueries({ queryKey: usdcBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: usdceBalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (needsApproval) {
        handleApprove(
          {
            address: baseToken.address,
            args: [
              process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
              MAX_INT,
            ],
          },
          {
            onSuccess: (data) => setApproveHash(data),
          },
        )
      } else {
        handleDeposit({
          onSuccess: handleDepositSuccess,
        })
      }
    },
  )

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isAmountSufficient = checkAmount(
      queryClient,
      values.amount,
      baseToken,
    )

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
      balance: needsSwap ? combinedBalance : usdcBalance,
    })
    if (!isBalanceSufficient) {
      form.setError("amount", {
        message: "Insufficient Arbitrum balance",
      })
      return
    }

    // Calculate total steps
    let steps = 1 // Deposit is always required
    if (needsSwapApproval) steps++
    if (needsSwap) steps++
    if (needsApproval) steps++
    setTotalSteps(steps)
    setCurrentStep(0)

    if (needsSwap && quote) {
      if (needsSwapApproval) {
        handleSwapApprove(
          {
            address: USDCE.address,
            args: [
              quote.estimate.approvalAddress as `0x${string}`,
              BigInt(quote?.estimate.fromAmount ?? MAX_INT),
            ],
          },
          {
            onSuccess: (data) => setSwapApproveHash(data),
          },
        )
      } else {
        handleSwap(
          // @ts-ignore
          {
            ...quote.transactionRequest,
            type: "legacy",
          },
          {
            onSuccess: (data) => setSwapHash(data),
          },
        )
      }
    } else if (needsApproval) {
      handleApprove(
        {
          address: baseToken.address,
          args: [
            process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
            MAX_INT,
          ],
        },
        {
          onSuccess: (data) => setApproveHash(data),
        },
      )
    } else {
      handleDeposit({
        onSuccess: handleDepositSuccess,
      })
    }
  }

  let buttonText = ""
  let buttonTextInParentheses = ""
  // TODO: After useSwap
  if (needsSwap) {
    if (!quote) {
      buttonText = "Fetching quote..."
    } else if (swapStatus === "pending") {
      buttonText = "Confirm in wallet"
      buttonTextInParentheses = `(${currentStep + 1} of ${totalSteps})`
    } else if (needsApproval) {
      buttonText = "Swap, Approve & Deposit"
    } else {
      buttonText = "Swap & Deposit"
    }
  } else if (needsApproval) {
    if (approveStatus === "pending") {
      buttonText = "Confirm in wallet"
      buttonTextInParentheses = `(${currentStep + 1} of ${totalSteps})`
    } else {
      buttonText = "Approve & Deposit"
    }
  } else {
    if (depositStatus === "pending") {
      buttonText = "Confirm in wallet"
      buttonTextInParentheses = `(${currentStep + 1} of ${totalSteps})`
    } else {
      buttonText = "Deposit"
    }
  }

  const handleDepositSuccess = (data: any) => {
    setCurrentStep((prev) => prev + 1)
    form.reset()
    onSuccess?.()
    const message = constructStartToastMessage(UpdateType.Deposit)
    toast.loading(message, {
      id: data.taskId,
    })
    setSide(Side.BUY)
  }

  const hideMaxButton =
    !mint ||
    formattedCombinedBalance === "0" ||
    amount.toString() === formattedCombinedBalance

  return (
    <Form {...form}>
      <form
        className="flex flex-1 flex-col"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div
          className={cn(
            "space-y-8 transition-all duration-300 ease-in-out",
            className,
          )}
        >
          <FormField
            control={form.control}
            name="mint"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Token</FormLabel>
                <TokenSelect
                  direction={ExternalTransferDirection.Deposit}
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid w-full items-center gap-3 transition-all duration-300 ease-in-out">
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
                            form.setValue("amount", formattedCombinedBalance, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Arbitrum Balance
                </div>
                <div className="flex items-center">
                  <ResponsiveTooltip>
                    <ResponsiveTooltipTrigger
                      asChild
                      className="cursor-pointer"
                    >
                      <Button
                        className="h-5 p-0"
                        type="button"
                        variant="link"
                        onClick={(e) => {
                          e.preventDefault()
                          form.setValue("amount", formattedUsdcBalance, {
                            shouldValidate: true,
                          })
                        }}
                      >
                        <div className="font-mono text-sm">
                          {baseToken
                            ? `${usdcBalanceLabel} ${baseToken.ticker}`
                            : "--"}
                        </div>
                      </Button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent>
                      {`${formattedUsdcBalance} ${baseToken?.ticker}`}
                    </ResponsiveTooltipContent>
                  </ResponsiveTooltip>
                </div>
              </div>
              <div className="text-right">
                <ResponsiveTooltip>
                  <ResponsiveTooltipTrigger asChild>
                    <Button
                      className="h-5 p-0"
                      type="button"
                      variant="link"
                      onClick={(e) => {
                        e.preventDefault()
                        form.setValue("amount", formattedCombinedBalance, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                    >
                      <div className="font-mono text-sm">
                        {`${usdceBalanceLabel}`}&nbsp;USDC.e
                      </div>
                    </Button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent>
                    {`${formattedUsdceBalance} USDC.e`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </div>
            </div>
            <MaxBalancesWarning
              className="text-sm text-orange-400 transition-all duration-300 ease-in-out"
              mint={mint}
            />
            {/* {needsWrapEth && (
              <WrapEthWarning
                minEthToKeepUnwrapped={minEthToKeepUnwrapped}
                remainingEthBalance={remainingEthBalance}
              />
            )} */}
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
                    isMaxBalances ||
                    swapStatus === "pending" ||
                    approveStatus === "pending" ||
                    depositStatus === "pending" ||
                    (maintenanceMode?.enabled &&
                      maintenanceMode.severity === "critical") ||
                    // TODO: Don't fetch quote if amount > combinedBalance
                    (needsSwap && !quote)
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
                  className="flex w-full flex-col items-center justify-center whitespace-normal text-pretty border-l-0 font-extended text-lg"
                  disabled={
                    !form.formState.isValid ||
                    isMaxBalances ||
                    swapStatus === "pending" ||
                    approveStatus === "pending" ||
                    depositStatus === "pending" ||
                    (maintenanceMode?.enabled &&
                      maintenanceMode.severity === "critical") ||
                    (needsSwap && !quote)
                  }
                  size="xl"
                  variant="outline"
                >
                  <span>{buttonText}</span>
                  {buttonTextInParentheses && (
                    <span className="whitespace-nowrap">
                      &nbsp;{buttonTextInParentheses}
                    </span>
                  )}
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
