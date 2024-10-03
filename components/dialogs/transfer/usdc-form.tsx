import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatUnits, parseUnits } from "viem"
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
import { SwapWarning } from "@/components/dialogs/transfer/swap-warning"
import {
  Step,
  getSteps,
} from "@/components/dialogs/transfer/transfer-details-page"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { useSwapQuote } from "@/components/dialogs/transfer/use-swap-quote"
import { useSwapState } from "@/components/dialogs/transfer/use-swap-state"
import { NumberInput } from "@/components/number-input"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useSwapConfirmation } from "@/hooks/use-swap-confirmation"
import { useTransactionConfirmation } from "@/hooks/use-transaction-confirmation"
import { useWaitForTask } from "@/hooks/use-wait-for-task"
import {
  MIN_DEPOSIT_AMOUNT,
  Side,
  UNLIMITED_ALLOWANCE,
} from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { catchErrorWithToast } from "@/lib/constants/toast"
import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf, useWriteErc20Approve } from "@/lib/generated"
import { ADDITIONAL_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

const USDCE = ADDITIONAL_TOKENS["USDC.e"]

const QUOTE_STALE_TIME = 1000 * 60 * 1 // 1 minute

// Assume direction is deposit and mint is USDC
const baseToken = Token.findByTicker("USDC")
export function USDCForm({
  className,
  form,
  onSuccess,
  header,
}: React.ComponentProps<"form"> & {
  onSuccess: () => void
  form: UseFormReturn<z.infer<typeof formSchema>>
  header: React.ReactNode
}) {
  const { address } = useAccount()
  const { checkChain } = useCheckChain()
  const isMaxBalances = useIsMaxBalances(baseToken.address)
  const { data: maintenanceMode } = useMaintenanceMode()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const queryClient = useQueryClient()
  const { setSide } = useSide()
  const [steps, setSteps] = React.useState<string[]>([])
  const [currentStep, setCurrentStep] = React.useState(0)

  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  // Ensure price is loaded
  usePriceQuery(baseToken.address)

  const { data: usdcBalance, queryKey: usdcBalanceQueryKey } =
    useReadErc20BalanceOf({
      address: baseToken.address,
      args: [address ?? "0x"],
      query: {
        enabled: !!address,
        staleTime: 0,
      },
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
      query: {
        enabled: !!address,
        staleTime: 0,
      },
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

  const combinedBalance =
    (usdcBalance ?? BigInt(0)) + (usdceBalance ?? BigInt(0))
  const formattedCombinedBalance = formatUnits(
    combinedBalance ?? BigInt(0),
    baseToken.decimals,
  )
  const { snapshot, captureSnapshot } = useSwapState(
    form,
    usdcBalance,
    usdceBalance,
  )

  const remainingUsdceBalance =
    parseUnits(amount, baseToken.decimals) > (usdcBalance ?? BigInt(0))
      ? combinedBalance - parseUnits(amount, baseToken.decimals)
      : usdceBalance ?? BigInt(0)

  const catchError = (error: Error, message: string) => {
    console.error("Error in USDC form", error)
    catchErrorWithToast(error, message)
  }

  // Fetch quote for swap
  const {
    data: quote,
    queryKey: quoteQueryKey,
    isFetching: isQuoteFetching,
    dataUpdatedAt: quoteUpdatedAt,
  } = useSwapQuote({
    fromMint: USDCE.address,
    toMint: baseToken.address,
    amount:
      snapshot.usdceToSwap ??
      (parseFloat(amount) - parseFloat(formattedUsdcBalance)).toFixed(6),
    enabled: currentStep === 0 && snapshot.swapRequired,
  })

  // Approve swap
  const { data: swapAllowanceRequired, queryKey: swapAllowanceQueryKey } =
    useAllowanceRequired({
      amount: formatUnits(
        BigInt(quote?.estimate.fromAmount ?? 0),
        USDCE.decimals,
      ),
      mint: USDCE.address,
      spender: quote?.estimate.approvalAddress,
      decimals: USDCE.decimals,
    })

  const {
    writeContract: handleApproveSwap,
    status: approveSwapStatus,
    data: approveSwapHash,
  } = useWriteErc20Approve({
    mutation: {
      onError: (error) => catchError(error, "Couldn't approve swap"),
    },
  })

  const approveSwapConfirmationStatus = useTransactionConfirmation(
    approveSwapHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: swapAllowanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (Date.now() - quoteUpdatedAt! > QUOTE_STALE_TIME) {
        await queryClient.refetchQueries({ queryKey: quoteQueryKey })
      }
      handleSwap(
        // @ts-ignore
        {
          // TODO: Maybe unsafe
          ...quote?.transactionRequest,
          type: "legacy",
        },
      )
    },
  )

  // Swap
  const {
    data: swapHash,
    sendTransaction: handleSwap,
    status: swapStatus,
  } = useSendTransaction({
    mutation: {
      onError: (error) => catchError(error, "Couldn't swap"),
    },
  })

  const swapConfirmationStatus = useSwapConfirmation(swapHash, (swap) => {
    queryClient.invalidateQueries({ queryKey: usdcBalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: usdceBalanceQueryKey })
    setCurrentStep((prev) => prev + 1)
    if (allowanceRequired) {
      handleApprove({
        address: baseToken.address,
        args: [
          process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
          UNLIMITED_ALLOWANCE,
        ],
      })
    } else {
      handleDeposit({
        amount: snapshot.swapRequired
          ? formatUnits(
              BigInt(swap.receivedAmount ?? 0) + snapshot.usdcBalance,
              baseToken.decimals,
            )
          : amount,
        mint,
        onSuccess: handleDepositSuccess,
      })
    }
  })

  // Approve deposit
  const { data: allowanceRequired, queryKey: usdcAllowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: baseToken.decimals,
    })

  const {
    writeContract: handleApprove,
    status: approveStatus,
    data: approveHash,
  } = useWriteErc20Approve({
    mutation: {
      onError: (error) => catchError(error, "Couldn't approve deposit"),
    },
  })

  const approveConfirmationStatus = useTransactionConfirmation(
    approveHash,
    () => {
      queryClient.invalidateQueries({ queryKey: usdcAllowanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      handleDeposit({
        amount: snapshot.swapRequired
          ? formatUnits(
              BigInt(swapConfirmationStatus?.receivedAmount ?? 0) +
                snapshot.usdcBalance,
              baseToken.decimals,
            )
          : amount,
        mint,
        onSuccess: handleDepositSuccess,
      })
    },
  )

  // Deposit
  const { handleDeposit, status: depositStatus } = useDeposit()

  const { status: depositTaskStatus, setTaskId } = useWaitForTask(() => {
    onSuccess?.()
  })

  const handleDepositSuccess = (data: any) => {
    setTaskId(data.taskId)
    // form.reset()
    onSuccess?.()
    const message = constructStartToastMessage(UpdateType.Deposit)
    toast.loading(message, {
      id: data.taskId,
    })
    setSide(Side.BUY)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isAmountSufficient = checkAmount(
      queryClient,
      snapshot.swapRequired
        ? formatUnits(
            BigInt(quote?.estimate.toAmountMin ?? 0) +
              (usdcBalance ?? BigInt(0)),
            USDCE.decimals,
          )
        : values.amount,
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
      balance: snapshot.swapRequired ? combinedBalance : usdcBalance,
    })
    if (!isBalanceSufficient) {
      form.setError("amount", {
        message: "Insufficient Arbitrum balance",
      })
      return
    }

    // Calculate and set initial steps
    setSteps(() => {
      const steps = []
      if (snapshot.swapRequired) {
        if (swapAllowanceRequired) {
          steps.push("Approve Swap")
        }
        steps.push("Swap USDC.e to USDC")
      }
      if (allowanceRequired) {
        steps.push("Approve Deposit")
      }
      steps.push("Deposit USDC")
      return steps
    })
    setCurrentStep(0)

    captureSnapshot(formattedUsdcBalance)

    await queryClient.refetchQueries({ queryKey: quoteQueryKey })
    if (snapshot.swapRequired) {
      if (!quote) {
        form.setError("root", {
          message: "Couldn't fetch quote",
        })
        return
      }
      if (swapAllowanceRequired) {
        handleApproveSwap({
          address: USDCE.address,
          args: [
            quote.estimate.approvalAddress as `0x${string}`,
            BigInt(quote?.estimate.fromAmount ?? UNLIMITED_ALLOWANCE),
          ],
        })
      } else {
        handleSwap(
          // @ts-ignore
          {
            ...quote.transactionRequest,
            type: "legacy",
          },
        )
      }
    } else if (allowanceRequired) {
      handleApprove({
        address: baseToken.address,
        args: [
          process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
          UNLIMITED_ALLOWANCE,
        ],
      })
    } else {
      handleDeposit({
        amount,
        mint,
        onSuccess: handleDepositSuccess,
      })
    }
  }

  const stepList: (Step | undefined)[] = React.useMemo(() => {
    return steps.map((step) => {
      switch (step) {
        case "Approve Swap":
          return {
            type: "transaction",
            txHash: approveSwapHash,
            mutationStatus: approveSwapStatus,
            txStatus: approveSwapConfirmationStatus,
            label: step,
          }
        case "Swap USDC.e to USDC":
          return {
            type: "transaction",
            txHash: swapHash,
            mutationStatus: swapStatus,
            txStatus: swapConfirmationStatus?.status,
            label: step,
          }
        case "Approve Deposit":
          return {
            type: "transaction",
            txHash: approveHash,
            mutationStatus: approveStatus,
            txStatus: approveConfirmationStatus,
            label: step,
          }
        case "Deposit USDC":
          return {
            type: "task",
            mutationStatus: depositStatus,
            taskStatus: depositTaskStatus,
            label: step,
          }
        default:
          return undefined
      }
    })
  }, [
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    approveSwapConfirmationStatus,
    approveSwapHash,
    approveSwapStatus,
    depositStatus,
    depositTaskStatus,
    steps,
    swapConfirmationStatus?.status,
    swapHash,
    swapStatus,
  ])

  const execution = React.useMemo(
    () => ({
      steps: stepList,
      baseToken,
    }),
    [stepList],
  )
  let buttonText = ""

  if (snapshot.swapRequired) {
    if (isQuoteFetching) {
      buttonText = "Fetching quote"
    } else {
      buttonText = "Swap & Deposit"
    }
  } else {
    if (allowanceRequired) {
      buttonText = "Approve & Deposit"
    } else {
      buttonText = "Deposit"
    }
  }

  const hideMaxButton =
    !mint ||
    formattedCombinedBalance === "0" ||
    amount.toString() === formattedCombinedBalance

  if (stepList.length > 0) {
    let Icon = <Loader2 className="h-6 w-6 animate-spin" />
    if (stepList.some((step) => step?.mutationStatus === "error")) {
      Icon = <AlertCircle className="h-6 w-6" />
    } else if (depositTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    }

    let title = "Depositing USDC"

    if (snapshot.swapRequired && isQuoteFetching) {
      title = "Fetching quote"
    } else if (stepList.some((step) => step?.mutationStatus === "pending")) {
      title = "Confirm in wallet"
    } else if (
      stepList.some((step) => step?.txHash && step?.txStatus === "pending")
    ) {
      title = "Waiting for confirmation"
    } else if (stepList.some((step) => step?.mutationStatus === "error")) {
      title = "Failed to deposit USDC"
    } else if (depositTaskStatus === "Completed") {
      title = "Completed"
    }

    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 font-extended">
            {Icon}
            {title}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Depositing USDC</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <div className="flex flex-1 flex-col p-6">
          <div className="space-y-3 border p-4 font-mono">
            {getSteps(execution, currentStep)}
          </div>
        </div>
        <DialogFooter className="mt-auto flex-row">
          <DialogClose asChild>
            <Button
              autoFocus
              className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
              size="xl"
              variant="outline"
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      {header}
      <Form {...form}>
        <form
          className="flex flex-1 flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div
            className={cn(
              "space-y-6 transition-all duration-300 ease-in-out",
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
            <div className="space-y-1">
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
                          if (Number(formattedUsdcBalance)) {
                            form.setValue("amount", formattedUsdcBalance, {
                              shouldValidate: true,
                            })
                          }
                        }}
                      >
                        <div className="font-mono text-sm">
                          {baseToken
                            ? `${usdcBalanceLabel} ${baseToken.ticker}`
                            : "--"}
                        </div>
                      </Button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent
                      side="right"
                      sideOffset={10}
                    >
                      {`${formattedUsdcBalance} ${baseToken?.ticker}`}
                    </ResponsiveTooltipContent>
                  </ResponsiveTooltip>
                </div>
              </div>
              <div className="text-right">
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
                        if (Number(formattedCombinedBalance)) {
                          form.setValue("amount", formattedCombinedBalance, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      }}
                    >
                      <div className="font-mono text-sm">
                        {`${usdceBalanceLabel}`}&nbsp;USDC.e
                      </div>
                    </Button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent
                    side="right"
                    sideOffset={10}
                  >
                    {`${formattedUsdceBalance} USDC.e`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </div>
            </div>
            <MaxBalancesWarning
              className="text-sm text-orange-400 transition-all duration-300 ease-in-out"
              mint={mint}
            />
            {snapshot.swapRequired && (
              <SwapWarning
                quote={quote}
                remainingBalance={remainingUsdceBalance}
              />
            )}
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
                      (maintenanceMode?.enabled &&
                        maintenanceMode.severity === "critical") ||
                      (snapshot.swapRequired && (isQuoteFetching || !quote))
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
                      (maintenanceMode?.enabled &&
                        maintenanceMode.severity === "critical") ||
                      (snapshot.swapRequired && (isQuoteFetching || !quote))
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
    </>
  )
}
