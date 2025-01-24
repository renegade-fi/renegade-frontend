import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType, useConfig } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { useDebounceValue, useMediaQuery } from "usehooks-ts"
import { formatUnits, isAddress } from "viem"
import { mainnet } from "viem/chains"
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import {
  ExternalTransferDirection,
  checkAmount,
  checkBalance,
  formSchema,
  normalizeStatus,
  verifyRecipientAddress,
} from "@/components/dialogs/transfer/helpers"
import { useChainBalance } from "@/components/dialogs/transfer/hooks/use-chain-balance"
import { useRenegadeBalance } from "@/components/dialogs/transfer/hooks/use-renegade-balance"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { Execution, Step, getSteps } from "@/components/dialogs/transfer/step"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { NumberInput } from "@/components/number-input"
import { TokenIcon } from "@/components/token-icon"
import { TooltipButton } from "@/components/tooltip-button"
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
import { Separator } from "@/components/ui/separator"

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
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
import { safeParseUnits } from "@/lib/format"
import { useReadErc20Allowance, useWriteErc20Approve } from "@/lib/generated"
import { ETHEREUM_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { chain, getFormattedChainName } from "@/lib/viem"
import { useServerStore } from "@/providers/state-provider/server-store-provider"
import { mainnetConfig } from "@/providers/wagmi-provider/config"

import { BridgePromptEthereum } from "./bridge-prompt-ethereum"
import { QUOTE_STALE_TIME } from "./constants"
import { useBridgeConfirmation } from "./hooks/use-bridge-confirmation"
import { NetworkLabel } from "./network-display"
import { NetworkSelect } from "./network-select"
import { ReviewBridge } from "./review-bridge"
import { EVMStep, STEP_CONFIGS } from "./types"
import { useBridgeQuote } from "./use-bridge-quote"

const catchError = (error: Error, message: string) => {
  console.error(`Error in ${L2_TOKEN?.ticker} form`, error)
  catchErrorWithToast(error, message)
}

const L1_TOKEN = ETHEREUM_TOKENS["WBTC"]
const L2_TOKEN = Token.findByTicker("WBTC")

export function WBTCForm({
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
  const queryClient = useQueryClient()
  const { setSide } = useServerStore((state) => state)
  const renegadeConfig = useConfig()
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const [currentStep, setCurrentStep] = React.useState(0)
  const [steps, setSteps] = React.useState<string[]>([])
  const [network, setNetwork] = React.useState<number>(chain.id)

  const [switchChainError, setSwitchChainError] = React.useState<Error | null>(
    null,
  )
  const { switchChainAsync } = useSwitchChain({
    mutation: {
      onError: (error) => setSwitchChainError(error),
    },
  })
  const switchChainAndInvoke = async (chainId: number, fn: () => void) =>
    switchChainAsync({ chainId })
      .then(fn)
      .catch((error) => catchError(error, "Couldn't switch chain"))

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const isMaxBalances = useIsMaxBalances(mint)

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
    token: L2_TOKEN,
  })

  const {
    bigint: l1Balance,
    string: formattedL1Balance,
    formatted: l1BalanceLabel,
    nonZero: userHasL1Balance,
    queryKey: l1BalanceQueryKey,
  } = useChainBalance({
    chainId: mainnet.id,
    token: L1_TOKEN,
  })

  const balance = formattedL2Balance
  const balanceLabel = l2BalanceLabel

  // Approve
  const { data: allowanceRequired, queryKey: allowanceQueryKey } =
    useAllowanceRequired({
      amount: amount.toString(),
      mint,
      spender: process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      decimals: L2_TOKEN?.decimals ?? 0,
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

  // Check if bridge is required
  const bridgeRequired = React.useMemo(() => {
    const isFirstStep = currentStep === 0
    const isCrosschainTransfer = network !== chain.id
    const hasValidAmount = Boolean(amount && Number(amount) > 0)

    return isFirstStep && isCrosschainTransfer && hasValidAmount
  }, [amount, currentStep, network])

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

  const [debouncedAmount] = useDebounceValue(() => {
    if (network !== chain.id) return amount
    return ""
  }, 1000)

  const {
    data: bridgeQuote,
    queryKey: bridgeQuoteQueryKey,
    fetchStatus: bridgeQuoteFetchStatus,
    dataUpdatedAt: bridgeQuoteUpdatedAt,
    error: bridgeQuoteError,
    refetch: refetchBridgeQuote,
  } = useBridgeQuote({
    fromChain: network,
    fromMint: L1_TOKEN.address,
    toChain: chain.id,
    toMint: L2_TOKEN.address,
    amount: debouncedAmount.toString(),
    enabled: bridgeRequired,
    // enabled: bridgeRequired && (network !== solana.id || solanaWallet.isConnected)
  })

  // Check if bridge allowance is required
  const {
    data: bridgeAllowanceRequired,
    status: bridgeAllowanceStatus,
    queryKey: bridgeAllowanceQueryKey,
  } = useReadErc20Allowance({
    address: L1_TOKEN.address,
    args: [
      address ?? "0x",
      (bridgeQuote?.estimate.approvalAddress ?? "0x") as `0x${string}`,
    ],
    config: mainnetConfig,
    query: {
      select: (data) => {
        const parsedAmount = safeParseUnits(amount, L1_TOKEN?.decimals)
        if (parsedAmount instanceof Error) return false
        return parsedAmount > data
      },
      enabled:
        !!address &&
        !!bridgeQuote?.estimate.approvalAddress &&
        isAddress(bridgeQuote?.estimate.approvalAddress),
    },
  })

  //  Approve bridge
  const {
    writeContract: handleApproveBridge,
    status: approveBridgeStatus,
    data: approveBridgeHash,
  } = useWriteErc20Approve({
    mutation: {
      onError: (error) => catchError(error, "Couldn't approve bridge"),
    },
  })

  const approveBridgeConfirmationStatus = useTransactionConfirmation(
    approveBridgeHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: bridgeAllowanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (Date.now() - bridgeQuoteUpdatedAt! > QUOTE_STALE_TIME) {
        await queryClient.refetchQueries({ queryKey: bridgeQuoteQueryKey })
      }
      await switchChainAndInvoke(mainnet.id, () =>
        handleEVMBridge(
          // @ts-ignore
          {
            // TODO: Maybe unsafe
            ...bridgeQuote?.transactionRequest,
            type: "legacy",
          },
        ),
      )
    },
    mainnetConfig,
  )

  // EVM Bridge
  const {
    data: bridgeHash,
    sendTransaction: handleEVMBridge,
    status: bridgeStatus,
  } = useSendTransaction({
    mutation: {
      onError: (error) => catchError(error, "Couldn't bridge"),
    },
  })

  const sendBridgeConfirmationStatus = useTransactionConfirmation(
    bridgeHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: l1BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
    },
    mainnetConfig,
  )

  const { data: bridgeExecutionStatus } = useBridgeConfirmation(
    bridgeHash,
    async (bridge) => {
      queryClient.invalidateQueries({ queryKey: l1BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: l2BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (allowanceRequired) {
        await switchChainAndInvoke(chain.id, () =>
          handleApprove({
            address: L2_TOKEN.address,
            args: [
              process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
              UNLIMITED_ALLOWANCE,
            ],
          }),
        )
      } else {
        await switchChainAndInvoke(chain.id, () =>
          handleDeposit({
            amount:
              network === mainnet.id
                ? formatUnits(
                    BigInt(bridge.receivedAmount ?? 0),
                    L2_TOKEN.decimals,
                  )
                : amount,
            mint,
            onSuccess: handleDepositSuccess,
          }),
        )
      }
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
    const message = constructStartToastMessage(UpdateType.Deposit)
    toast.loading(message, {
      id: data.taskId,
    })
    setSide(L2_TOKEN?.ticker === "USDC" ? Side.BUY : Side.SELL)
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
    const isAmountSufficient = checkAmount(queryClient, values.amount, L2_TOKEN)

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
      balance: network === mainnet.id ? l1Balance : l2Balance,
    })
    if (!isBalanceSufficient) {
      form.setError("amount", {
        message: `Insufficient ${getFormattedChainName(network)} balance`,
      })
      return
    }

    if (bridgeRequired && bridgeQuote) {
      const validRecipient = await verifyRecipientAddress(
        renegadeConfig,
        bridgeQuote?.action.toAddress,
      )
      if (!validRecipient) {
        form.setError("root", {
          message: "Recipient address does not match Renegade wallet",
        })
        return
      }
    }

    // TODO:
    // Calculate and set initial steps
    setSteps(() => {
      const steps = []

      if (network === mainnet.id) {
        if (bridgeAllowanceRequired) {
          steps.push(EVMStep.APPROVE_BRIDGE)
        }
        steps.push(EVMStep.SOURCE_BRIDGE)
        steps.push(EVMStep.DESTINATION_BRIDGE)
      }
      if (allowanceRequired) {
        steps.push(EVMStep.APPROVE_DEPOSIT)
      }
      steps.push(EVMStep.DEPOSIT)
      return steps
    })
    setCurrentStep(0)

    if (network === mainnet.id) {
      if (!bridgeQuote) {
        form.setError("root", {
          message: "Couldn't fetch bridge quote",
        })
        return
      }
      if (bridgeAllowanceRequired) {
        await switchChainAndInvoke(mainnet.id, async () =>
          handleApproveBridge({
            chainId: mainnet.id,
            address: L1_TOKEN.address,
            args: [
              bridgeQuote?.estimate.approvalAddress as `0x${string}`,
              BigInt(bridgeQuote?.estimate.fromAmount ?? UNLIMITED_ALLOWANCE),
            ],
          }),
        )
      } else {
        await switchChainAndInvoke(mainnet.id, async () =>
          handleEVMBridge(
            // @ts-ignore
            {
              ...bridgeQuote?.transactionRequest,
              type: "legacy",
            },
          ),
        )
      }
    } else if (allowanceRequired && L2_TOKEN?.address) {
      await handleApprove({
        address: L2_TOKEN.address,
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
        case EVMStep.APPROVE_DEPOSIT:
          return {
            type: "transaction",
            txHash: approveHash,
            mutationStatus: approveStatus,
            txStatus: approveConfirmationStatus,
            label: step,
          }
        case EVMStep.DEPOSIT:
          return {
            type: "task",
            mutationStatus: depositStatus,
            taskStatus: depositTaskStatus,
            label: `Deposit ${L2_TOKEN?.ticker}`,
          }
        case EVMStep.APPROVE_BRIDGE:
          return {
            type: "transaction",
            txHash: approveBridgeHash,
            mutationStatus: approveBridgeStatus,
            txStatus: approveBridgeConfirmationStatus,
            label: STEP_CONFIGS[EVMStep.APPROVE_BRIDGE].label,
            chainId: STEP_CONFIGS[EVMStep.APPROVE_BRIDGE].chainId,
          }
        case EVMStep.SOURCE_BRIDGE:
          return {
            type: "transaction",
            txHash: bridgeHash,
            mutationStatus: bridgeStatus,
            txStatus: sendBridgeConfirmationStatus,
            label: STEP_CONFIGS[EVMStep.SOURCE_BRIDGE].label,
            chainId: STEP_CONFIGS[EVMStep.SOURCE_BRIDGE].chainId,
          }
        case EVMStep.DESTINATION_BRIDGE:
          return {
            type: "lifi",
            lifiExplorerLink: bridgeExecutionStatus?.lifiExplorerLink,
            txHash: bridgeExecutionStatus?.receiveHash as `0x${string}`,
            txStatus: normalizeStatus(bridgeExecutionStatus?.status),
            label: STEP_CONFIGS[EVMStep.DESTINATION_BRIDGE].label,
          }
        default:
          return
      }
    })
  }, [
    approveBridgeConfirmationStatus,
    approveBridgeHash,
    approveBridgeStatus,
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    bridgeExecutionStatus?.lifiExplorerLink,
    bridgeExecutionStatus?.receiveHash,
    bridgeExecutionStatus?.status,
    bridgeHash,
    bridgeStatus,
    depositStatus,
    depositTaskStatus,
    sendBridgeConfirmationStatus,
    steps,
  ])

  const execution = React.useMemo(() => {
    return {
      steps: stepList,
      token: L2_TOKEN,
    } satisfies Execution
  }, [stepList])

  let buttonText = ""
  if (bridgeRequired) {
    buttonText = "Bridge & Deposit"
  } else {
    if (allowanceRequired) {
      buttonText = "Approve & Deposit"
    } else {
      buttonText = "Deposit"
    }
  }

  const hideMaxButton =
    !mint || balance === "0" || amount.toString() === balance

  const isSubmitDisabled =
    !form.formState.isValid ||
    isMaxBalances ||
    (bridgeRequired &&
      (bridgeQuoteFetchStatus === "fetching" || !bridgeQuote)) ||
    (bridgeRequired && bridgeAllowanceStatus !== "success")

  if (stepList.length > 0) {
    let Icon = <Loader2 className="h-6 w-6 animate-spin" />
    if (
      stepList.some(
        (step) =>
          step?.mutationStatus === "error" ||
          (step?.type === "task" && step.taskStatus === "Failed") ||
          switchChainError,
      )
    ) {
      Icon = <AlertCircle className="h-6 w-6" />
    } else if (depositTaskStatus === "Completed") {
      Icon = <Check className="h-6 w-6" />
    }

    let title = `Depositing ${L2_TOKEN?.ticker}`

    if (
      stepList.some(
        (step) =>
          step?.mutationStatus === "error" ||
          (step?.type === "task" && step.taskStatus === "Failed") ||
          switchChainError,
      )
    ) {
      title = `Failed to deposit ${L2_TOKEN?.ticker}`
    } else if (stepList.some((step) => step?.mutationStatus === "pending")) {
      title = "Confirm in wallet"
    } else if (
      stepList.some((step) => step?.txHash && step?.txStatus === "pending")
    ) {
      title = "Waiting for confirmation"
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
            <DialogDescription>Depositing {L2_TOKEN?.ticker}</DialogDescription>
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

  const renderTransferOptions = () => {
    if (bridgeRequired) {
      return (
        <>
          <Separator />
          <ReviewBridge
            error={bridgeQuoteError}
            quote={bridgeQuote}
          />
        </>
      )
    }

    return userHasL1Balance ? (
      <BridgePromptEthereum
        hasBalance={userHasL1Balance}
        onClick={() => {
          if (Number(formattedL1Balance)) {
            setNetwork(mainnet.id)
            form.setValue("amount", formattedL1Balance, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        }}
      />
    ) : (
      <></>
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
          <div className={cn("flex flex-col gap-6", className)}>
            <div
              className={cn("flex flex-col space-y-2", {
                hidden: !userHasL1Balance,
              })}
            >
              <Label>Network</Label>
              <NetworkSelect
                hasEthereumBalance={userHasL1Balance}
                hasSolanaBalance={false}
                value={network}
                onChange={(value) => setNetwork(value)}
              />
            </div>
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
                  <TokenIcon
                    size={16}
                    ticker="ARB"
                  />
                  Arbitrum
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
                        {L2_TOKEN ? `${balanceLabel} ${L2_TOKEN.ticker}` : "--"}
                      </div>
                    </Button>
                  </ResponsiveTooltipTrigger>
                  <ResponsiveTooltipContent
                    side="right"
                    sideOffset={10}
                  >
                    {`${balance} ${L2_TOKEN?.ticker}`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
              </div>
            </div>

            <div
              className={cn("flex justify-between", {
                hidden: !userHasL1Balance,
              })}
            >
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Balance on&nbsp;
                <NetworkLabel chainId={mainnet.id} />
              </div>
              <TooltipButton
                className="h-5 p-0 font-mono text-sm"
                tooltipContent={formattedL1Balance}
                variant="link"
                onClick={() => {
                  if (Number(formattedL1Balance)) {
                    setNetwork(mainnet.id)
                    form.setValue("amount", formattedL1Balance, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                }}
              >
                {L1_TOKEN ? `${l1BalanceLabel} ${L1_TOKEN.ticker}` : "--"}
              </TooltipButton>
            </div>

            {renderTransferOptions()}

            <MaxBalancesWarning
              className="text-sm text-orange-400"
              mint={mint}
            />
          </div>
          {isDesktop ? (
            <DialogFooter>
              <MaintenanceButtonWrapper
                messageKey="transfer"
                triggerClassName="flex-1"
              >
                <Button
                  className="flex-1 border-0 border-t font-extended text-2xl"
                  disabled={isSubmitDisabled}
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
                  className="w-full whitespace-normal border-l-0 font-extended text-lg"
                  disabled={isSubmitDisabled}
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
