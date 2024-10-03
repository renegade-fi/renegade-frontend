import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType, useBackOfQueueWallet } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { formatEther, parseEther } from "viem"
import { useAccount, useBalance } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import {
  ExternalTransferDirection,
  checkAmount,
  checkBalance,
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
import { Label } from "@/components/ui/label"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"
import { Switch } from "@/components/ui/switch"

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useBasePerQuotePrice } from "@/hooks/use-base-per-usd-price"
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
import {
  useReadErc20BalanceOf,
  useWriteErc20Approve,
  useWriteWethDeposit,
  useWriteWethWithdraw,
} from "@/lib/generated"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

import { WrapEthWarning } from "./wrap-eth-warning"

// Assume mint is WETH
const baseToken = Token.findByTicker("WETH")

export function WETHForm({
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
  const isMaxBalances = useIsMaxBalances(baseToken.address)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { data: maintenanceMode } = useMaintenanceMode()
  const isTradePage = usePathname().includes("/trade")
  const queryClient = useQueryClient()
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [steps, setSteps] = React.useState<string[]>([])
  const [unwrapRequired, setUnwrapRequired] = React.useState(false)
  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const amount = useWatch({
    control: form.control,
    name: "amount",
  })

  const { data: renegadeBalance } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === mint)?.amount,
    },
  })
  const formattedRenegadeBalance = formatEther(renegadeBalance ?? BigInt(0))
  const renegadeBalanceLabel = formatNumber(
    renegadeBalance ?? BigInt(0),
    baseToken.decimals,
    true,
  )

  const { data: l2Balance, queryKey: l2BalanceQueryKey } =
    useReadErc20BalanceOf({
      address: baseToken.address,
      args: [address ?? "0x"],
      query: {
        staleTime: 0,
        enabled: direction === ExternalTransferDirection.Deposit && !!address,
      },
    })

  useRefreshOnBlock({ queryKey: l2BalanceQueryKey })

  const formattedL2Balance = formatEther(l2Balance ?? BigInt(0))
  const l2BalanceLabel = formatNumber(
    l2Balance ?? BigInt(0),
    baseToken.decimals,
    true,
  )

  const balance =
    direction === ExternalTransferDirection.Deposit
      ? formattedL2Balance
      : formattedRenegadeBalance
  const balanceLabel =
    direction === ExternalTransferDirection.Deposit
      ? l2BalanceLabel
      : renegadeBalanceLabel

  // ETH-specific logic
  const { data: ethBalance, queryKey: ethBalanceQueryKey } = useBalance({
    address,
  })
  const formattedEthBalance = formatEther(ethBalance?.value ?? BigInt(0))
  const ethBalanceLabel = formatNumber(ethBalance?.value ?? BigInt(0), 18, true)
  const basePerQuotePrice = useBasePerQuotePrice(baseToken.address)

  // Calculate the minimum ETH to keep unwrapped for gas fees
  const minEthToKeepUnwrapped = basePerQuotePrice ?? BigInt(4e15)

  const combinedBalance =
    (l2Balance ?? BigInt(0)) + (ethBalance?.value ?? BigInt(0))
  const maxAmountToWrap = combinedBalance - minEthToKeepUnwrapped
  const formattedMaxAmountToWrap = formatEther(maxAmountToWrap)

  // ||
  // (direction === ExternalTransferDirection.Deposit &&
  //   minEthToKeepUnwrapped > (ethBalance?.value ?? BigInt(0)))

  const remainingEthBalance =
    parseEther(amount) > (l2Balance ?? BigInt(0))
      ? combinedBalance - parseEther(amount)
      : ethBalance?.value ?? BigInt(0)

  // If the amount is greater than the WETH balance, we need to wrap ETH
  const wrapRequired =
    parseEther(amount) > (l2Balance ?? BigInt(0)) &&
    parseEther(amount) <= combinedBalance
  // Ensure price is loaded
  usePriceQuery(baseToken.address)
  const { setSide } = useSide()

  const catchError = (error: Error, message: string) => {
    console.error("Error in WETH form", error)
    catchErrorWithToast(error, message)
  }

  // Wrap ETH
  const {
    data: wrapHash,
    writeContract: wrapEth,
    status: wrapStatus,
  } = useWriteWethDeposit({
    mutation: {
      onError: (error) => catchError(error, "Couldn't wrap ETH"),
    },
  })

  const wrapConfirmationStatus = useTransactionConfirmation(
    wrapHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: ethBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: l2BalanceQueryKey })
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
          amount,
          mint,
          onSuccess: handleDepositSuccess,
        })
      }
    },
  )

  // Approve deposit
  const { data: allowanceRequired, queryKey: wethAllowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: baseToken.decimals,
    })

  const {
    data: approveHash,
    writeContract: handleApprove,
    status: approveStatus,
  } = useWriteErc20Approve({
    mutation: {
      onError: (error) => catchError(error, "Couldn't approve deposit"),
    },
  })

  const approveConfirmationStatus = useTransactionConfirmation(
    approveHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: wethAllowanceQueryKey }),
        handleDeposit({
          amount,
          mint,
          onSuccess: handleDepositSuccess,
        })
    },
  )

  // Deposit
  const { handleDeposit, status: depositStatus } = useDeposit()

  const { status: depositTaskStatus, setTaskId } = useWaitForTask()

  const handleDepositSuccess = (data: any) => {
    setTaskId(data.taskId)
    // form.reset()
    onSuccess?.()
    const message = constructStartToastMessage(UpdateType.Deposit)
    toast.loading(message, {
      id: data.taskId,
    })
    setSide(Side.SELL)
    if (isTradePage) {
      router.push(`/trade/WETH`)
    }
  }

  // Withdraw
  const { handleWithdraw, status: withdrawStatus } = useWithdraw({
    amount,
    mint,
  })
  const { status: withdrawTaskStatus, setTaskId: setWithdrawTaskId } =
    useWaitForTask(async () => {
      if (unwrapRequired) {
        setCurrentStep((prev) => prev + 1)
        // Wait to prevent contract error
        await new Promise((resolve) => setTimeout(resolve, 1000))
        unwrapWeth({
          address: baseToken.address,
          args: [parseEther(amount)],
        })
      }
      onSuccess?.()
    })

  const handleWithdrawSuccess = (data: any) => {
    setWithdrawTaskId(data.taskId)
    // form.reset()
  }

  // Unwrap
  const {
    data: unwrapHash,
    writeContract: unwrapWeth,
    status: unwrapStatus,
  } = useWriteWethWithdraw({
    mutation: {
      onError: (error) => catchError(error, "Couldn't unwrap WETH"),
    },
  })

  const unwrapConfirmationStatus = useTransactionConfirmation(
    unwrapHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: l2BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: ethBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: ["readContracts"] })
      onSuccess?.()
    },
  )

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
        balance: wrapRequired ? combinedBalance : l2Balance,
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
        if (wrapRequired) {
          steps.push("Wrap ETH")
        }
        if (allowanceRequired) {
          steps.push("Approve Deposit")
        }
        steps.push("Deposit WETH")
        return steps
      })
      setCurrentStep(0)

      if (wrapRequired) {
        const ethAmount = parseEther(values.amount) - (l2Balance ?? BigInt(0))
        wrapEth({
          address: baseToken.address,
          value: ethAmount,
        })
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
        steps.push("Withdraw WETH")
        if (unwrapRequired) {
          steps.push("Unwrap WETH")
        }
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
        case "Wrap ETH":
          return {
            type: "transaction",
            txHash: wrapHash,
            mutationStatus: wrapStatus,
            txStatus: wrapConfirmationStatus,
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
        case "Deposit WETH":
          return {
            type: "task",
            mutationStatus: depositStatus,
            taskStatus: depositTaskStatus,
            label: step,
          }
        case "Withdraw WETH":
          return {
            type: "task",
            mutationStatus: withdrawStatus,
            taskStatus: withdrawTaskStatus,
            label: step,
          }
        case "Unwrap WETH":
          return {
            type: "transaction",
            txHash: unwrapHash,
            mutationStatus: unwrapStatus,
            txStatus: unwrapConfirmationStatus,
            label: step,
          }
        default:
          return
      }
    })
  }, [
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    depositStatus,
    depositTaskStatus,
    steps,
    unwrapConfirmationStatus,
    unwrapHash,
    unwrapStatus,
    withdrawStatus,
    withdrawTaskStatus,
    wrapConfirmationStatus,
    wrapHash,
    wrapStatus,
  ])

  const execution = React.useMemo(
    () => ({
      steps: stepList,
      baseToken,
    }),
    [stepList],
  )

  let buttonText = ""
  if (direction === ExternalTransferDirection.Deposit) {
    if (wrapRequired) {
      buttonText = "Wrap & Deposit"
    } else if (allowanceRequired) {
      buttonText = "Approve & Deposit"
    } else {
      buttonText = "Deposit"
    }
  } else {
    buttonText = "Withdraw"
  }

  const maxValue =
    direction === ExternalTransferDirection.Deposit
      ? formattedMaxAmountToWrap
      : formattedRenegadeBalance

  const hideMaxButton =
    !mint ||
    maxValue === "0" ||
    amount.toString() === maxValue ||
    (direction === ExternalTransferDirection.Deposit &&
      maxAmountToWrap < BigInt(0))

  if (steps.length > 0) {
    let Icon = <Loader2 className="h-6 w-6 animate-spin" />
    if (stepList.some((step) => step?.mutationStatus === "error")) {
      Icon = <AlertCircle className="h-6 w-6" />
    } else if (
      direction === ExternalTransferDirection.Deposit &&
      depositTaskStatus === "Completed"
    ) {
      Icon = <Check className="h-6 w-6" />
    } else if (unwrapRequired) {
      if (unwrapConfirmationStatus === "success") {
        Icon = <Check className="h-6 w-6" />
      }
    } else if (
      direction === ExternalTransferDirection.Withdraw &&
      withdrawTaskStatus === "Completed"
    ) {
      Icon = <Check className="h-6 w-6" />
    }

    let title = `${direction === ExternalTransferDirection.Deposit ? "Depositing" : "Withdrawing"} WETH`
    if (stepList.some((step) => step?.mutationStatus === "pending")) {
      title = "Confirm in wallet"
    } else if (
      stepList.some((step) => step?.txHash && step?.txStatus === "pending")
    ) {
      title = "Waiting for confirmation"
    } else if (wrapStatus === "error" || wrapConfirmationStatus === "error") {
      title = "Failed to wrap ETH"
    } else if (
      unwrapStatus === "error" ||
      unwrapConfirmationStatus === "error"
    ) {
      title = "Failed to unwrap WETH"
    } else if (stepList.some((step) => step?.mutationStatus === "error")) {
      title = `Failed to ${direction === ExternalTransferDirection.Deposit ? "deposit" : "withdraw"} WETH`
    } else if (
      direction === ExternalTransferDirection.Deposit &&
      depositTaskStatus === "Completed"
    ) {
      title = "Completed"
    } else if (unwrapRequired) {
      if (unwrapConfirmationStatus === "success") {
        title = "Completed"
      }
    } else if (
      direction === ExternalTransferDirection.Withdraw &&
      withdrawTaskStatus === "Completed"
    ) {
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
            <DialogDescription>
              {direction === ExternalTransferDirection.Deposit
                ? `Depositing WETH`
                : `Withdrawing WETH`}
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
                    direction={direction}
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
                            form.setValue("amount", maxValue, {
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
                  {direction === ExternalTransferDirection.Deposit
                    ? "Arbitrum"
                    : "Renegade"}
                  &nbsp;Balance
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
                          if (Number(balance)) {
                            form.setValue("amount", balance, {
                              shouldValidate: true,
                            })
                          }
                        }}
                      >
                        <div className="font-mono text-sm">
                          {baseToken
                            ? `${balanceLabel} ${baseToken.ticker}`
                            : "--"}
                        </div>
                      </Button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent
                      side="right"
                      sideOffset={10}
                    >
                      {`${balance} ${baseToken.ticker}`}
                    </ResponsiveTooltipContent>
                  </ResponsiveTooltip>
                </div>
              </div>
              <div
                className={cn(
                  "text-right",
                  direction === ExternalTransferDirection.Deposit
                    ? "block"
                    : "hidden",
                )}
              >
                <ResponsiveTooltip>
                  <ResponsiveTooltipTrigger
                    asChild
                    className={cn(
                      "!pointer-events-auto",
                      maxAmountToWrap < BigInt(0) ? "" : "cursor-pointer",
                    )}
                  >
                    <Button
                      className="h-5 p-0"
                      disabled={maxAmountToWrap < BigInt(0)}
                      type="button"
                      variant="link"
                      onClick={(e) => {
                        e.preventDefault()
                        form.setValue("amount", formattedMaxAmountToWrap, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }}
                    >
                      <div className="font-mono text-sm">
                        {`${ethBalanceLabel}`}&nbsp;ETH
                      </div>
                    </Button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent
                    side="right"
                    sideOffset={10}
                  >
                    {maxAmountToWrap < BigInt(0)
                      ? "Not enough ETH to wrap"
                      : `${formattedEthBalance} ETH`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </div>
            </div>
            <div
              className={cn(
                "items-center justify-between border p-3",
                direction === ExternalTransferDirection.Withdraw
                  ? "flex"
                  : "hidden",
              )}
            >
              <div className="space-y-0.5">
                <Label
                  className=""
                  htmlFor="unwrap"
                >
                  Withdraw ETH
                </Label>
                <div className="text-[0.8rem] text-muted-foreground">
                  Receive native ETH instead of wrapped ETH
                </div>
              </div>
              <Switch
                checked={unwrapRequired}
                id="unwrap"
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") {
                    setUnwrapRequired(checked)
                  }
                }}
              />
            </div>
            {direction === ExternalTransferDirection.Deposit && (
              <MaxBalancesWarning
                className="text-sm text-orange-400"
                mint={mint}
              />
            )}
            {direction === ExternalTransferDirection.Deposit &&
              wrapRequired && (
                <WrapEthWarning
                  minEthToKeepUnwrapped={minEthToKeepUnwrapped}
                  remainingEthBalance={remainingEthBalance}
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
                      (direction === ExternalTransferDirection.Deposit &&
                        isMaxBalances) ||
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
                    className="flex w-full flex-col items-center justify-center whitespace-normal text-pretty border-l-0 font-extended text-lg"
                    disabled={
                      !form.formState.isValid ||
                      (direction === ExternalTransferDirection.Deposit &&
                        isMaxBalances) ||
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
