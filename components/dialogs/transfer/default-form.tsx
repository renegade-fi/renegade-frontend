import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { UpdateType } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { mainnet } from "viem/chains"
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
import { useChainBalance } from "@/components/dialogs/transfer/hooks/use-chain-balance"
import { useRenegadeBalance } from "@/components/dialogs/transfer/hooks/use-renegade-balance"
import { useToken } from "@/components/dialogs/transfer/hooks/use-token"
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
import { TRANSFER_DIALOG_L1_BALANCE_TOOLTIP } from "@/lib/constants/tooltips"
import { useWriteErc20Approve } from "@/lib/generated"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

const catchError = (error: Error, message: string) => {
  console.error("Error in USDC form", error)
  catchErrorWithToast(error, message)
}

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

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const isMaxBalances = useIsMaxBalances(mint)
  const l2Token = useToken({
    mint,
  })
  const l1Token = useToken({
    mint: l2Token?.address,
    chainId: mainnet.id,
  })

  const {
    bigint: renegadeBalance,
    string: formattedRenegadeBalance,
    formatted: renegadeBalanceLabel,
  } = useRenegadeBalance(mint)

  const {
    bigint: l2Balance,
    string: formattedL2Balance,
    formatted: l2BalanceLabel,
  } = useChainBalance({
    mint,
    enabled: isDeposit,
  })

  const {
    string: formattedL1Balance,
    formatted: l1BalanceLabel,
    nonZero: userHasL1Balance,
  } = useChainBalance({
    chainId: mainnet.id,
    mint,
    enabled: isDeposit,
  })

  const balance = isDeposit ? formattedL2Balance : formattedRenegadeBalance
  const balanceLabel = isDeposit ? l2BalanceLabel : renegadeBalanceLabel

  // Approve
  const { data: allowanceRequired, queryKey: allowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: l2Token?.decimals ?? 0,
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
    setSide(l2Token?.ticker === "USDC" ? Side.BUY : Side.SELL)
    // TODO: Automatically closes dialog
    // if (isTradePage && l2Token?.ticker !== "USDC") {
    //   router.push(`/trade/${l2Token?.ticker}`)
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
    const isAmountSufficient = checkAmount(queryClient, values.amount, l2Token)

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

      if (allowanceRequired && l2Token?.address) {
        await handleApprove({
          address: l2Token.address,
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
            label: `Deposit ${l2Token?.ticker}`,
          }
        case "Withdraw":
          return {
            type: "task",
            mutationStatus: withdrawStatus,
            taskStatus: withdrawTaskStatus,
            label: `Withdraw ${l2Token?.ticker}`,
          }
        default:
          return
      }
    })
  }, [
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    l2Token?.ticker,
    depositStatus,
    depositTaskStatus,
    steps,
    withdrawStatus,
    withdrawTaskStatus,
  ])

  const execution = React.useMemo(() => {
    return {
      steps: stepList,
      l2Token,
    }
  }, [stepList, l2Token])

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

    let title = `${isDeposit ? "Depositing" : "Withdrawing"} ${l2Token?.ticker}`
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
      title = `Failed to ${isDeposit ? "deposit" : "withdraw"} ${l2Token?.ticker}`
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
                ? `Depositing ${l2Token?.ticker}`
                : `Withdrawing ${l2Token?.ticker}`}
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
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  Balance&nbsp;on&nbsp;
                  {isDeposit ? (
                    <>
                      <TokenIcon
                        size={16}
                        ticker="ARB"
                      />
                      Arbitrum
                    </>
                  ) : (
                    "Renegade"
                  )}
                </div>
                <ResponsiveTooltip>
                  <ResponsiveTooltipTrigger
                    asChild
                    className="cursor-pointer"
                  >
                    <Button
                      className="h-5 p-0"
                      type="button"
                      variant="link"
                      onClick={() => {
                        if (Number(balance)) {
                          form.setValue("amount", balance, {
                            shouldValidate: true,
                          })
                        }
                      }}
                    >
                      <div className="font-mono text-sm">
                        {l2Token ? `${balanceLabel} ${l2Token.ticker}` : "--"}
                      </div>
                    </Button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent
                    side="right"
                    sideOffset={10}
                  >
                    {`${balance} ${l2Token?.ticker}`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </div>
            </div>

            <div
              className={cn("flex justify-between", {
                hidden: !userHasL1Balance || !isDeposit || !l1Token?.address,
              })}
            >
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Balance on&nbsp;
                <TokenIcon
                  size={16}
                  ticker="WETH"
                />
                Ethereum
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className="h-5 cursor-pointer p-0 font-mono text-sm"
                    type="button"
                    variant="link"
                  >
                    <a
                      href={constructArbitrumBridgeUrl(
                        formattedL1Balance,
                        l1Token?.address,
                      )}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {l1Token ? `${l1BalanceLabel} ${l1Token.ticker}` : "--"}
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={10}
                >
                  {TRANSFER_DIALOG_L1_BALANCE_TOOLTIP}
                </TooltipContent>
              </Tooltip>
            </div>

            <div
              className={cn({
                hidden: !userHasL1Balance || !isDeposit || !l1Token?.address,
              })}
            >
              <BridgePrompt
                formattedL1Balance={formattedL1Balance}
                token={l1Token}
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
