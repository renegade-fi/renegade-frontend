import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { UpdateType } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { encodeFunctionData, formatEther, parseEther } from "viem"
import { mainnet } from "viem/chains"
import { useAccount, useBalance, useEstimateGas } from "wagmi"
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
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { ReviewWrap } from "@/components/dialogs/transfer/review-wrap"
import { Execution, Step, getSteps } from "@/components/dialogs/transfer/step"
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
import { Label } from "@/components/ui/label"
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useBasePerQuotePrice } from "@/hooks/use-base-per-usd-price"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useOnChainBalances } from "@/hooks/use-on-chain-balances"
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
import { formatNumber } from "@/lib/format"
import {
  useWriteErc20Approve,
  useWriteWethDeposit,
  useWriteWethWithdraw,
  wethAbi,
} from "@/lib/generated"
import { ETHEREUM_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { sdkConfig } from "@/providers/renegade-provider/config"
import { useServerStore } from "@/providers/state-provider/server-store-provider"
import {
  arbitrumConfig,
  mainnetConfig,
} from "@/providers/wagmi-provider/config"

const WETH_L1_TOKEN = ETHEREUM_TOKENS["WETH"]
// Assume mint is WETH
const WETH_L2_TOKEN = Token.findByTicker("WETH")

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
  const isMaxBalances = useIsMaxBalances(WETH_L2_TOKEN.address)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
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
  const isDeposit = direction === ExternalTransferDirection.Deposit

  const {
    bigint: renegadeBalance,
    string: formattedRenegadeBalance,
    formatted: renegadeBalanceLabel,
  } = useRenegadeBalance(mint)

  const {
    bigint: l2Balance,
    string: formattedL2Balance,
    formatted: l2BalanceLabel,
    queryKey: l2BalanceQueryKey,
  } = useChainBalance({
    token: WETH_L2_TOKEN,
    enabled: isDeposit,
  })

  const {
    string: formattedWethL1Balance,
    formatted: wethL1BalanceLabel,
    nonZero: userHasWethL1Balance,
  } = useChainBalance({
    token: WETH_L1_TOKEN,
    chainId: mainnet.id,
    enabled: isDeposit,
  })

  const balance = isDeposit ? formattedL2Balance : formattedRenegadeBalance
  const balanceLabel = isDeposit ? l2BalanceLabel : renegadeBalanceLabel

  // ETH-specific logic
  const { data: ethL2Balance, queryKey: ethL2BalanceQueryKey } = useBalance({
    address,
    config: arbitrumConfig,
  })
  const formattedEthL2Balance = formatEther(ethL2Balance?.value ?? BigInt(0))
  const ethL2BalanceLabel = formatNumber(
    ethL2Balance?.value ?? BigInt(0),
    18,
    true,
  )
  const basePerQuotePrice = useBasePerQuotePrice(WETH_L2_TOKEN.address)

  const { data: ethL1Balance, status: ethL1BalanceStatus } = useBalance({
    address,
    config: mainnetConfig,
  })
  const formattedEthL1Balance = formatEther(ethL1Balance?.value ?? BigInt(0))
  const ethL1BalanceLabel = formatNumber(
    ethL1Balance?.value ?? BigInt(0),
    18,
    true,
  )
  const userHasEthL1Balance = Boolean(
    ethL1BalanceStatus === "success" && ethL1Balance,
  )

  // Calculate the minimum ETH to keep unwrapped for gas fees
  const minEthToKeepUnwrapped = basePerQuotePrice ?? BigInt(4e15)

  const combinedBalance =
    (l2Balance ?? BigInt(0)) + (ethL2Balance?.value ?? BigInt(0))
  const maxAmountToWrap = combinedBalance - minEthToKeepUnwrapped
  const formattedMaxAmountToWrap = formatEther(maxAmountToWrap)

  const remainingEthBalance =
    parseEther(amount) > (l2Balance ?? BigInt(0))
      ? combinedBalance - parseEther(amount)
      : (ethL2Balance?.value ?? BigInt(0))

  // If the amount is greater than the WETH balance, we need to wrap ETH
  const wrapRequired =
    parseEther(amount) > (l2Balance ?? BigInt(0)) &&
    parseEther(amount) <= combinedBalance
  const { setSide } = useServerStore((state) => state)

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

  const ethAmount = parseEther(amount) - (l2Balance ?? BigInt(0))
  const { data: gasEstimate } = useEstimateGas({
    to: WETH_L2_TOKEN.address,
    value: ethAmount,
    data: encodeFunctionData({
      abi: wethAbi,
      functionName: "deposit",
    }),
  })

  const wrapConfirmationStatus = useTransactionConfirmation(
    wrapHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: ethL2BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: l2BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (allowanceRequired) {
        handleApprove({
          address: WETH_L2_TOKEN.address,
          args: [sdkConfig.permit2Address, UNLIMITED_ALLOWANCE],
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
      spender: sdkConfig.permit2Address,
      decimals: WETH_L2_TOKEN.decimals,
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
          address: WETH_L2_TOKEN.address,
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

  const { queryKey: combinedBalancesQueryKey } = useOnChainBalances({
    address,
    mints: [WETH_L2_TOKEN.address],
  })

  const unwrapConfirmationStatus = useTransactionConfirmation(
    unwrapHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: l2BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: ethL2BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: combinedBalancesQueryKey })
      onSuccess?.()
    },
  )

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const isAmountSufficient = checkAmount(
      queryClient,
      values.amount,
      WETH_L2_TOKEN,
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
          address: WETH_L2_TOKEN.address,
          value: ethAmount,
        })
      } else if (allowanceRequired) {
        handleApprove({
          address: WETH_L2_TOKEN.address,
          args: [sdkConfig.permit2Address, UNLIMITED_ALLOWANCE],
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
    () =>
      ({
        steps: stepList,
        token: WETH_L2_TOKEN,
      }) satisfies Execution,
    [stepList],
  )

  let buttonText = ""
  if (isDeposit) {
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

  const maxValue = isDeposit
    ? formattedMaxAmountToWrap
    : formattedRenegadeBalance

  const renderPrompts = () => {
    if (!isDeposit) {
      return null
    }
    if (wrapRequired) {
      return (
        <>
          <Separator />
          <ReviewWrap
            gasEstimate={gasEstimate}
            minEthToKeepUnwrapped={minEthToKeepUnwrapped}
            remainingEthBalance={remainingEthBalance}
            wrapAmount={
              parseEther(form.getValues("amount")) - (l2Balance ?? BigInt(0))
            }
          />
        </>
      )
    }

    if (userHasWethL1Balance || userHasEthL1Balance) {
      return (
        <BridgePrompt
          formattedL1Balance={formattedWethL1Balance}
          token={WETH_L1_TOKEN}
        />
      )
    }
  }

  const hideMaxButton =
    !mint ||
    maxValue === "0" ||
    amount.toString() === maxValue ||
    (isDeposit && maxAmountToWrap < BigInt(0))

  if (steps.length > 0) {
    let Icon = <Loader2 className="h-6 w-6 animate-spin" />
    if (stepList.some((step) => step?.mutationStatus === "error")) {
      Icon = <AlertCircle className="h-6 w-6" />
    } else if (isDeposit && depositTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    } else if (unwrapRequired) {
      if (unwrapConfirmationStatus === "success") {
        Icon = <Check className="h-6 w-6" />
      }
    } else if (!isDeposit && withdrawTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    }

    let title = `${isDeposit ? "Depositing" : "Withdrawing"} WETH`
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
      title = `Failed to ${isDeposit ? "deposit" : "withdraw"} WETH`
    } else if (isDeposit && depositTaskStatus === "Completed") {
      title = "Completed"
    } else if (unwrapRequired) {
      if (unwrapConfirmationStatus === "success") {
        title = "Completed"
      }
    } else if (!isDeposit && withdrawTaskStatus === "Completed") {
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
              {isDeposit ? `Depositing WETH` : `Withdrawing WETH`}
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
          <ScrollArea className="max-h-[70vh]">
            <div className={cn("flex flex-col gap-6", className)}>
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
                          onClick={() => {
                            if (Number(balance)) {
                              form.setValue("amount", balance, {
                                shouldValidate: true,
                              })
                            }
                          }}
                        >
                          <div className="font-mono text-sm">
                            {WETH_L2_TOKEN
                              ? `${balanceLabel} ${WETH_L2_TOKEN.ticker}`
                              : "--"}
                          </div>
                        </Button>
                      </ResponsiveTooltipTrigger>
                      <ResponsiveTooltipContent
                        side="right"
                        sideOffset={10}
                      >
                        {`${balance} ${WETH_L2_TOKEN.ticker}`}
                      </ResponsiveTooltipContent>
                    </ResponsiveTooltip>
                  </div>
                </div>

                <div
                  className={cn("text-right", isDeposit ? "block" : "hidden")}
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
                        onClick={() => {
                          form.setValue("amount", formattedMaxAmountToWrap, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }}
                      >
                        <div className="font-mono text-sm">
                          {`${ethL2BalanceLabel}`}&nbsp;ETH
                        </div>
                      </Button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent
                      side="right"
                      sideOffset={10}
                    >
                      {maxAmountToWrap < BigInt(0)
                        ? "Not enough ETH to wrap"
                        : `${formattedEthL2Balance} ETH`}
                    </ResponsiveTooltipContent>
                  </ResponsiveTooltip>
                </div>
              </div>

              <div
                className={cn("flex items-start justify-between", {
                  hidden:
                    (!userHasWethL1Balance && !userHasEthL1Balance) ||
                    !isDeposit,
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
                <div className="flex flex-col items-end">
                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      className={cn({
                        hidden: !userHasWethL1Balance,
                      })}
                    >
                      <Button
                        asChild
                        className="mb-1 h-5 cursor-pointer p-0 font-mono text-sm"
                        type="button"
                        variant="link"
                      >
                        <a
                          href={constructArbitrumBridgeUrl(
                            formattedWethL1Balance,
                          )}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {WETH_L2_TOKEN
                            ? `${wethL1BalanceLabel} ${WETH_L2_TOKEN.ticker}`
                            : "--"}
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={10}
                    >
                      Bridge to Arbitrum to deposit
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger
                      asChild
                      className={cn({
                        hidden: !userHasEthL1Balance,
                      })}
                    >
                      <Button
                        asChild
                        className="h-5 cursor-pointer p-0 font-mono text-sm"
                        type="button"
                        variant="link"
                      >
                        <a
                          href={constructArbitrumBridgeUrl(
                            formattedEthL1Balance,
                          )}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {`${ethL1BalanceLabel}`}&nbsp;ETH
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
              </div>

              <div
                className={cn(
                  "items-center justify-between border p-3",
                  !isDeposit ? "flex" : "hidden",
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
              {isDeposit && (
                <MaxBalancesWarning
                  className="text-sm text-orange-400"
                  mint={mint}
                />
              )}
              {renderPrompts()}
            </div>
          </ScrollArea>
          {isDesktop ? (
            <DialogFooter>
              <MaintenanceButtonWrapper
                messageKey="transfer"
                triggerClassName="flex-1"
              >
                <Button
                  className="flex-1 border-0 border-t font-extended text-2xl"
                  disabled={
                    !form.formState.isValid || (isDeposit && isMaxBalances)
                  }
                  size="xl"
                  type="submit"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </MaintenanceButtonWrapper>
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
              <MaintenanceButtonWrapper
                messageKey="transfer"
                triggerClassName="flex-1"
              >
                <Button
                  className="flex w-full flex-col items-center justify-center whitespace-normal text-pretty border-l-0 font-extended text-lg"
                  disabled={
                    !form.formState.isValid || (isDeposit && isMaxBalances)
                  }
                  size="xl"
                  type="submit"
                  variant="outline"
                >
                  {buttonText}
                </Button>
              </MaintenanceButtonWrapper>
            </DialogFooter>
          )}
        </form>
      </Form>
    </>
  )
}
