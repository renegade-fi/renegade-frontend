import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType, useBackOfQueueWallet } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, ExternalLink, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import { BridgePrompt } from "@/components/dialogs/transfer/bridge-prompt"
import {
  ExternalTransferDirection,
  checkAmount,
  checkBalance,
  constructArbitrumBridgeUrl,
  formSchema,
  isMaxBalance,
} from "@/components/dialogs/transfer/helpers"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import {
  Step,
  getSteps,
} from "@/components/dialogs/transfer/transfer-details-page"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { NumberInput } from "@/components/number-input"
import { TokenIcon } from "@/components/token-icon"
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useTransactionConfirmation } from "@/hooks/use-transaction-confirmation"
import { useWaitForTask } from "@/hooks/use-wait-for-task"
import { useWithdraw } from "@/hooks/use-withdraw"
import {
  MIN_DEPOSIT_AMOUNT,
  Side,
  UNLIMITED_ALLOWANCE,
} from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { catchErrorWithToast } from "@/lib/constants/toast"
import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf, useWriteErc20Approve } from "@/lib/generated"
import { ETHEREUM_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"
import { mainnetConfig } from "@/providers/wagmi-provider/wagmi-provider"

export function DefaultForm({
  className,
  direction,
  form,
  onSuccess,
  header,
}: React.ComponentProps<"form"> & {
  direction: ExternalTransferDirection
  onSuccess: () => void
  form: UseFormReturn<z.infer<typeof formSchema>>
  header: React.ReactNode
}) {
  const { address } = useAccount()
  const { checkChain } = useCheckChain()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { data: maintenanceMode } = useMaintenanceMode()
  const isTradePage = usePathname().includes("/trade")
  const queryClient = useQueryClient()
  const router = useRouter()
  const { setSide } = useSide()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [steps, setSteps] = React.useState<string[]>([])
  const isDeposit = direction === ExternalTransferDirection.Deposit

  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const isMaxBalances = useIsMaxBalances(mint)
  const baseToken = mint
    ? Token.findByAddress(mint as `0x${string}`)
    : undefined
  // Ensure price is loaded
  usePriceQuery(baseToken?.address || "0x")

  const { data: renegadeBalance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === mint)?.amount,
    },
  })

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
      enabled: isDeposit && !!baseToken && !!address,
      staleTime: 0,
    },
  })

  const l1Token =
    baseToken && baseToken.ticker in ETHEREUM_TOKENS
      ? ETHEREUM_TOKENS[baseToken.ticker as keyof typeof ETHEREUM_TOKENS]
      : undefined

  const {
    data: l1Balance,
    queryKey: l1QueryKey,
    status: l1Status,
  } = useReadErc20BalanceOf({
    address: l1Token?.address,
    args: [address ?? "0x"],
    config: mainnetConfig,
    query: {
      enabled: isDeposit && !!baseToken && !!address && !!l1Token?.address,
      staleTime: 0,
    },
  })
  const formattedL1Balance = baseToken
    ? formatUnits(l1Balance ?? BigInt(0), l1Token?.decimals ?? 0)
    : ""
  const l1BalanceLabel = baseToken
    ? formatNumber(l1Balance ?? BigInt(0), l1Token?.decimals ?? 0, true)
    : ""
  const userHasL1Balance = Boolean(l1Status === "success" && l1Balance)
  console.log("🚀 ~ userHasL1Balance:", userHasL1Balance)

  useRefreshOnBlock({ queryKey })

  const formattedL2Balance = baseToken
    ? formatUnits(l2Balance ?? BigInt(0), baseToken.decimals)
    : ""
  const l2BalanceLabel = baseToken
    ? formatNumber(l2Balance ?? BigInt(0), baseToken.decimals, true)
    : ""

  const balance = isDeposit ? formattedL2Balance : formattedRenegadeBalance
  const balanceLabel = isDeposit ? l2BalanceLabel : renegadeBalanceLabel

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })

  const catchError = (error: Error, message: string) => {
    console.error("Error in USDC form", error)
    catchErrorWithToast(error, message)
  }

  // Approve
  const { data: allowanceRequired, queryKey: allowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: baseToken?.decimals ?? 0,
    })

  const {
    data: approveHash,
    writeContractAsync: handleApprove,
    status: approveStatus,
  } = useWriteErc20Approve({
    mutation: {
      onError: (error) => catchError(error, "Couldn't approve"),
    },
  })

  const approveConfirmationStatus = useTransactionConfirmation(
    approveHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: allowanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      handleDeposit({
        amount,
        mint,
        onSuccess: handleDepositSuccess,
      })
    },
  )

  // Deposit
  const { handleDeposit, status: depositStatus } = useDeposit()

  const { status: depositTaskStatus, setTaskId: setDepositTaskId } =
    useWaitForTask(() => {
      onSuccess?.()
    })

  const handleDepositSuccess = (data: any) => {
    setDepositTaskId(data.taskId)
    // form.reset()
    // onSuccess?.()
    const message = constructStartToastMessage(UpdateType.Deposit)
    toast.loading(message, {
      id: data.taskId,
    })
    setSide(baseToken?.ticker === "USDC" ? Side.BUY : Side.SELL)
    // TODO: Automatically closes dialog
    // if (isTradePage && baseToken?.ticker !== "USDC") {
    //   router.push(`/trade/${baseToken?.ticker}`)
    // }
  }

  // Withdraw
  const { handleWithdraw, status: withdrawStatus } = useWithdraw({
    amount,
    mint,
  })
  const { status: withdrawTaskStatus, setTaskId: setWithdrawTaskId } =
    useWaitForTask(() => {
      onSuccess?.()
    })

  const handleWithdrawSuccess = (data: any) => {
    setWithdrawTaskId(data.taskId)
    // form.reset()
    onSuccess?.()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isAmountSufficient = checkAmount(
      queryClient,
      values.amount,
      baseToken,
    )

    if (isDeposit) {
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

      // Calculate and set initial steps
      setSteps(() => {
        const steps = []
        if (allowanceRequired) {
          steps.push("Approve Deposit")
        }
        steps.push("Deposit")
        return steps
      })
      setCurrentStep(0)

      if (allowanceRequired && baseToken?.address) {
        await handleApprove({
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
    } else {
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

      // Calculate and set initial steps
      setSteps(() => {
        const steps = []
        steps.push("Withdraw")
        return steps
      })
      setCurrentStep(0)

      handleWithdraw({
        onSuccess: handleWithdrawSuccess,
      })
    }
  }

  const stepList: (Step | undefined)[] = React.useMemo(() => {
    return steps.map((step) => {
      switch (step) {
        case "Approve Deposit":
          return {
            type: "transaction",
            txHash: approveHash,
            mutationStatus: approveStatus,
            txStatus: approveConfirmationStatus,
            label: step,
          }
        case "Deposit":
          return {
            type: "task",
            mutationStatus: depositStatus,
            taskStatus: depositTaskStatus,
            label: `Deposit ${baseToken?.ticker}`,
          }
        case "Withdraw":
          return {
            type: "task",
            mutationStatus: withdrawStatus,
            taskStatus: withdrawTaskStatus,
            label: `Withdraw ${baseToken?.ticker}`,
          }
        default:
          return
      }
    })
  }, [
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    baseToken?.ticker,
    depositStatus,
    depositTaskStatus,
    steps,
    withdrawStatus,
    withdrawTaskStatus,
  ])

  const execution = React.useMemo(() => {
    return {
      steps: stepList,
      baseToken,
    }
  }, [stepList, baseToken])

  let buttonText = ""
  if (isDeposit) {
    if (allowanceRequired) {
      buttonText = "Approve & Deposit"
    } else {
      buttonText = "Deposit"
    }
  } else {
    buttonText = "Withdraw"
  }

  const hideMaxButton =
    !mint || balance === "0" || amount.toString() === balance

  if (steps.length > 0) {
    let Icon = <Loader2 className="h-6 w-6 animate-spin" />
    if (stepList.some((step) => step?.mutationStatus === "error")) {
      Icon = <AlertCircle className="h-6 w-6" />
    } else if (isDeposit && depositTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    } else if (!isDeposit && withdrawTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    }

    let title = `${isDeposit ? "Depositing" : "Withdrawing"} ${baseToken?.ticker}`
    if (
      isDeposit &&
      stepList.some((step) => step?.mutationStatus === "pending")
    ) {
      title = "Confirm in wallet"
    } else if (
      stepList.some((step) => step?.txHash && step?.txStatus === "pending")
    ) {
      title = "Waiting for confirmation"
    } else if (stepList.some((step) => step?.mutationStatus === "error")) {
      title = `Failed to ${isDeposit ? "deposit" : "withdraw"} ${baseToken?.ticker}`
    } else if (
      (isDeposit && depositTaskStatus === "Completed") ||
      (!isDeposit && withdrawTaskStatus === "Completed")
    ) {
      title = `Completed`
    }

    return (
      <>
        <DialogHeader className="space-y-4 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 font-extended">
            {Icon}
            {title}
          </DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              {isDeposit
                ? `Depositing ${baseToken?.ticker}`
                : `Withdrawing ${baseToken?.ticker}`}
            </DialogDescription>
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
          <div className={cn("space-y-6", className)}>
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
            <div className="space-y-1">
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Balance&nbsp;on&nbsp;
                  {isDeposit ? "Arbitrum" : "Renegade"}
                </div>
                <Button
                  className="h-5 p-0"
                  type="button"
                  variant="link"
                  onClick={(e) => {
                    e.preventDefault()
                    if (Number(balance)) {
                      form.setValue("amount", balance, {
                        shouldValidate: true,
                      })
                    }
                  }}
                >
                  <div className="font-mono text-sm">
                    {baseToken ? `${balanceLabel} ${baseToken.ticker}` : "--"}
                  </div>
                </Button>
              </div>
              <div
                className={cn("flex justify-between", {
                  hidden: !userHasL1Balance || !isDeposit,
                })}
              >
                <div className="text-sm text-muted-foreground">
                  Balance on Ethereum
                </div>
                <Button
                  asChild
                  className="h-5 p-0 font-mono text-sm"
                  variant="link"
                >
                  <a
                    href={constructArbitrumBridgeUrl(formattedL1Balance)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {baseToken ? `${l1BalanceLabel} ${baseToken.ticker}` : "--"}
                  </a>
                </Button>
              </div>
            </div>

            <div
              className={cn({
                hidden: !userHasL1Balance || !isDeposit,
              })}
            >
              <BridgePrompt
                baseToken={baseToken}
                formattedL1Balance={formattedL1Balance}
              />
            </div>

            {isDeposit && (
              <MaxBalancesWarning
                className="text-sm text-orange-400"
                mint={mint}
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
                      (isDeposit && isMaxBalances) ||
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
                      (isDeposit && isMaxBalances) ||
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
    </>
  )
}
