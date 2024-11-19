import * as React from "react"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Token, UpdateType } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { useDebounceValue } from "usehooks-ts"
import { formatUnits, isAddress, parseUnits } from "viem"
import { mainnet } from "viem/chains"
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi"
import { z } from "zod"

import { TokenSelect } from "@/components/dialogs/token-select"
import { BridgePromptEthereum } from "@/components/dialogs/transfer/bridge-prompt-ethereum"
import { BridgePromptSolana } from "@/components/dialogs/transfer/bridge-prompt-solana"
import {
  ExternalTransferDirection,
  checkAmount,
  checkBalance,
  formSchema,
  normalizeStatus,
} from "@/components/dialogs/transfer/helpers"
import { useBridgeConfirmation } from "@/components/dialogs/transfer/hooks/use-bridge-confirmation"
import { useChainBalance } from "@/components/dialogs/transfer/hooks/use-chain-balance"
import { useSendSolanaTransaction } from "@/components/dialogs/transfer/hooks/use-send-solana-transaction"
import { useSolanaChainBalance } from "@/components/dialogs/transfer/hooks/use-solana-balance"
import { useSolanaTransactionConfirmation } from "@/components/dialogs/transfer/hooks/use-solana-transaction-confirmation"
import { MaxBalancesWarning } from "@/components/dialogs/transfer/max-balances-warning"
import { NetworkLabel } from "@/components/dialogs/transfer/network-display"
import { NetworkSelect } from "@/components/dialogs/transfer/network-select"
import { ReviewBridge } from "@/components/dialogs/transfer/review-bridge"
import { ReviewSwap } from "@/components/dialogs/transfer/review-swap"
import { Execution, Step, getSteps } from "@/components/dialogs/transfer/step"
import { useBridgeQuote } from "@/components/dialogs/transfer/use-bridge-quote"
import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances"
import { useSwapQuote } from "@/components/dialogs/transfer/use-swap-quote"
import { useSwapState } from "@/components/dialogs/transfer/use-swap-state"
import { NumberInput } from "@/components/number-input"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { useAllowanceRequired } from "@/hooks/use-allowance-required"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useSwapConfirmation } from "@/hooks/use-swap-confirmation"
import { useTransactionConfirmation } from "@/hooks/use-transaction-confirmation"
import { useWaitForTask } from "@/hooks/use-wait-for-task"
import { useWallets } from "@/hooks/use-wallets"
import {
  MIN_DEPOSIT_AMOUNT,
  Side,
  UNLIMITED_ALLOWANCE,
} from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { catchErrorWithToast } from "@/lib/constants/toast"
import { safeParseUnits } from "@/lib/format"
import { useReadErc20Allowance, useWriteErc20Approve } from "@/lib/generated"
import { ADDITIONAL_TOKENS, ETHEREUM_TOKENS, SOLANA_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"
import { chain, getFormattedChainName, solana } from "@/lib/viem"
import { useServerStore } from "@/providers/state-provider/server-store-provider"
import { mainnetConfig } from "@/providers/wagmi-provider/config"

import { EVMStep, STEP_CONFIGS, SVMStep, TransferStep } from "./types"

const USDC_L1_TOKEN = ETHEREUM_TOKENS["USDC"]
const USDC_L2_TOKEN = Token.findByTicker("USDC")
const USDCE_L2_TOKEN = ADDITIONAL_TOKENS["USDC.e"]
const USDC_SOLANA_TOKEN = SOLANA_TOKENS["USDC"]

const QUOTE_STALE_TIME = 1000 * 60 * 1 // 1 minute

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
  const isMaxBalances = useIsMaxBalances(USDC_L2_TOKEN.address)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const queryClient = useQueryClient()
  const { setSide } = useServerStore((state) => state)
  const [network, setNetwork] = React.useState<number>(chain.id)
  const [steps, setSteps] = React.useState<TransferStep[]>([])
  const [currentStep, setCurrentStep] = React.useState(0)
  const [switchChainError, setSwitchChainError] = React.useState<Error | null>(
    null,
  )
  const { solanaWallet } = useWallets()
  const { switchChainAsync } = useSwitchChain({
    mutation: {
      onError: (error) => setSwitchChainError(error),
    },
  })

  const catchError = (error: Error, message: string) => {
    console.error("Error in USDC form", error)
    catchErrorWithToast(error, message)
    switchChainAsync({ chainId: chain.id })
  }

  const mint = useWatch({
    control: form.control,
    name: "mint",
  })
  const amount = useWatch({
    control: form.control,
    name: "amount",
  })
  React.useEffect(() => {
    form.clearErrors()
  }, [form, network])

  const {
    bigint: usdcL2Balance,
    string: formattedUsdcL2Balance,
    formatted: formattedUsdcL2BalanceLabel,
    queryKey: usdcL2BalanceQueryKey,
  } = useChainBalance({
    token: USDC_L2_TOKEN,
  })

  const {
    bigint: usdcL1Balance,
    string: formattedUsdcL1Balance,
    formatted: usdcL1BalanceLabel,
    nonZero: userHasUsdcL1Balance,
    queryKey: usdcL1BalanceQueryKey,
  } = useChainBalance({
    token: USDC_L1_TOKEN,
    chainId: mainnet.id,
  })

  const {
    bigint: usdceL2Balance,
    string: formattedUsdceL2Balance,
    formatted: usdceL2BalanceLabel,
    queryKey: usdceL2BalanceQueryKey,
  } = useChainBalance({
    token: USDCE_L2_TOKEN,
  })

  const {
    bigint: usdcSolanaBalance,
    string: formattedUsdcSolanaBalance,
    formatted: usdcSolanaBalanceLabel,
    nonZero: userHasUsdcSolanaBalance,
    queryKey: usdcSolanaBalanceQueryKey,
  } = useSolanaChainBalance({
    ticker: "USDC",
  })

  const combinedBalance =
    (usdcL2Balance ?? BigInt(0)) + (usdceL2Balance ?? BigInt(0))
  const formattedCombinedBalance = formatUnits(
    combinedBalance ?? BigInt(0),
    USDC_L2_TOKEN.decimals,
  )
  const maxValue =
    network === mainnet.id ? formattedUsdcL1Balance : formattedCombinedBalance

  const { snapshot, captureSnapshot } = useSwapState(
    form,
    usdcL2Balance,
    usdceL2Balance,
  )
  // TODO: Rework this to isolate to this component
  const swapRequired = React.useMemo(() => {
    return network === chain.id && snapshot.swapRequired
  }, [network, snapshot.swapRequired])

  const remainingUsdceBalance =
    parseUnits(amount, USDC_L2_TOKEN.decimals) > (usdcL2Balance ?? BigInt(0))
      ? combinedBalance - parseUnits(amount, USDC_L2_TOKEN.decimals)
      : usdceL2Balance ?? BigInt(0)

  const switchChainAndInvoke = async (chainId: number, fn: () => void) =>
    switchChainAsync({ chainId })
      .then(fn)
      .catch((error) => catchError(error, "Couldn't switch chain"))

  // Fetch bridge quote
  const bridgeRequired = React.useMemo(() => {
    const isFirstStep = currentStep === 0
    const isCrosschainTransfer = network !== chain.id
    const hasValidAmount = Boolean(amount && Number(amount) > 0)
    const hasSolanaWallet = network !== solana.id || solanaWallet.isConnected

    return (
      isFirstStep && isCrosschainTransfer && hasValidAmount && hasSolanaWallet
    )
  }, [amount, currentStep, network, solanaWallet.isConnected])

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
  } = useBridgeQuote({
    fromChain: network,
    fromMint:
      network === mainnet.id ? USDC_L1_TOKEN.address : USDC_SOLANA_TOKEN,
    toChain: chain.id,
    toMint: USDC_L2_TOKEN.address,
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
    address: USDC_L1_TOKEN.address,
    args: [
      address ?? "0x",
      (bridgeQuote?.estimate.approvalAddress ?? "0x") as `0x${string}`,
    ],
    config: mainnetConfig,
    query: {
      select: (data) => {
        const parsedAmount = safeParseUnits(
          amount,
          USDC_L1_TOKEN?.decimals ?? 0,
        )
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

  // Solana Bridge
  const {
    mutateAsync: handleSolanaBridge,
    data: solanaBridgeHash,
    status: solanaBridgeStatus,
  } = useSendSolanaTransaction((error) => {
    catchError(error, "Couldn't bridge")
  })

  const solanaConfirmationStatus = useSolanaTransactionConfirmation(
    solanaBridgeHash,
    async () => {
      queryClient.invalidateQueries({ queryKey: usdcSolanaBalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
    },
  )

  // useBridgeConfirmation for solana bridge action
  const { data: solanaBridgeExecutionStatus } = useBridgeConfirmation(
    solanaBridgeHash,
    async (bridge) => {
      queryClient.invalidateQueries({ queryKey: usdcSolanaBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: usdcL2BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (allowanceRequired) {
        await switchChainAndInvoke(chain.id, () =>
          handleApprove({
            address: USDC_L2_TOKEN.address,
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
              network !== chain.id
                ? formatUnits(
                    BigInt(bridge.receivedAmount ?? 0),
                    USDC_L2_TOKEN.decimals,
                  )
                : amount,
            mint,
            onSuccess: handleDepositSuccess,
          }),
        )
      }
    },
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
      queryClient.invalidateQueries({ queryKey: usdcL1BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
    },
    mainnetConfig,
  )

  const { data: bridgeExecutionStatus } = useBridgeConfirmation(
    bridgeHash,
    async (bridge) => {
      queryClient.invalidateQueries({ queryKey: usdcL1BalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: usdcL2BalanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      if (allowanceRequired) {
        await switchChainAndInvoke(chain.id, () =>
          handleApprove({
            address: USDC_L2_TOKEN.address,
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
                    USDC_L2_TOKEN.decimals,
                  )
                : amount,
            mint,
            onSuccess: handleDepositSuccess,
          }),
        )
      }
    },
  )

  // Fetch quote for swap
  const {
    data: swapQuote,
    error: swapQuoteError,
    queryKey: quoteQueryKey,
    isFetching: isQuoteFetching,
    dataUpdatedAt: quoteUpdatedAt,
  } = useSwapQuote({
    fromMint: USDCE_L2_TOKEN.address,
    toMint: USDC_L2_TOKEN.address,
    amount:
      snapshot.usdceToSwap ??
      (parseFloat(amount) - parseFloat(formattedUsdcL2Balance)).toFixed(6),
    enabled: currentStep === 0 && swapRequired && network === chain.id,
  })

  // Approve swap
  const { data: swapAllowanceRequired, queryKey: swapAllowanceQueryKey } =
    useAllowanceRequired({
      amount: formatUnits(
        BigInt(swapQuote?.estimate.fromAmount ?? 0),
        USDCE_L2_TOKEN.decimals,
      ),
      mint: USDCE_L2_TOKEN.address,
      spender: swapQuote?.estimate.approvalAddress,
      decimals: USDCE_L2_TOKEN.decimals,
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
      await switchChainAndInvoke(chain.id, () =>
        handleSwap(
          // @ts-ignore
          {
            // TODO: Maybe unsafe
            ...swapQuote?.transactionRequest,
            type: "legacy",
          },
        ),
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

  const swapConfirmationStatus = useSwapConfirmation(swapHash, async (swap) => {
    queryClient.invalidateQueries({ queryKey: usdcL2BalanceQueryKey })
    queryClient.invalidateQueries({ queryKey: usdceL2BalanceQueryKey })
    setCurrentStep((prev) => prev + 1)
    if (allowanceRequired) {
      await switchChainAndInvoke(chain.id, () =>
        handleApprove({
          address: USDC_L2_TOKEN.address,
          args: [
            process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
            UNLIMITED_ALLOWANCE,
          ],
        }),
      )
    } else {
      await switchChainAndInvoke(chain.id, () =>
        handleDeposit({
          amount: swapRequired
            ? formatUnits(
                BigInt(swap.receivedAmount ?? 0) + snapshot.usdcBalance,
                USDC_L2_TOKEN.decimals,
              )
            : amount,
          mint,
          onSuccess: handleDepositSuccess,
        }),
      )
    }
  })

  const { data: allowanceRequired, queryKey: usdcL2AllowanceQueryKey } =
    useReadErc20Allowance({
      address: USDC_L2_TOKEN.address,
      args: [
        address ?? "0x",
        process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
      ],
      chainId: chain.id,
      query: {
        select: (data) => {
          const parsedAmount = safeParseUnits(amount, USDC_L2_TOKEN.decimals)
          if (parsedAmount instanceof Error) return false
          return parsedAmount > data
        },
        enabled: address && !!address && Number(amount) > 0,
      },
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
    async () => {
      queryClient.invalidateQueries({ queryKey: usdcL2AllowanceQueryKey })
      setCurrentStep((prev) => prev + 1)
      await switchChainAndInvoke(chain.id, () =>
        handleDeposit({
          amount:
            network === mainnet.id
              ? formatUnits(
                  BigInt(bridgeExecutionStatus?.receivedAmount ?? 0),
                  USDC_L2_TOKEN.decimals,
                )
              : swapRequired
                ? formatUnits(
                    BigInt(swapConfirmationStatus?.receivedAmount ?? 0) +
                      snapshot.usdcBalance,
                    USDC_L2_TOKEN.decimals,
                  )
                : amount,
          mint,
          onSuccess: handleDepositSuccess,
        }),
      )
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
      swapRequired
        ? formatUnits(
            BigInt(swapQuote?.estimate.toAmountMin ?? 0) +
              (usdcL2Balance ?? BigInt(0)),
            USDCE_L2_TOKEN.decimals,
          )
        : values.amount,
      USDC_L2_TOKEN,
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
      balance:
        network === mainnet.id
          ? usdcL1Balance
          : network === solana.id
            ? usdcSolanaBalance
            : swapRequired
              ? combinedBalance
              : usdcL2Balance,
    })
    if (!isBalanceSufficient) {
      form.setError("amount", {
        message: `Insufficient ${getFormattedChainName(network)} balance`,
      })
      return
    }

    // Calculate and set initial steps
    setSteps(() => {
      const steps: TransferStep[] = []
      if (network === mainnet.id) {
        if (bridgeAllowanceRequired) {
          steps.push(EVMStep.APPROVE_BRIDGE)
        }
        steps.push(EVMStep.SOURCE_BRIDGE)
        steps.push(EVMStep.DESTINATION_BRIDGE)
      } else if (network === solana.id) {
        steps.push(SVMStep.SOURCE_BRIDGE)
        steps.push(SVMStep.DESTINATION_BRIDGE)
      } else if (swapRequired) {
        if (swapAllowanceRequired) {
          steps.push(EVMStep.APPROVE_SWAP)
        }
        steps.push(EVMStep.SWAP)
      }
      if (allowanceRequired) {
        steps.push(EVMStep.APPROVE_DEPOSIT)
      }
      steps.push(EVMStep.DEPOSIT)
      return steps
    })
    setCurrentStep(0)

    captureSnapshot(formattedUsdcL2Balance)

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
            address: USDC_L1_TOKEN.address,
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
    } else if (network === solana.id) {
      await queryClient.refetchQueries({ queryKey: bridgeQuoteQueryKey })
      if (!bridgeQuote) {
        form.setError("root", {
          message: "Couldn't fetch bridge quote",
        })
        return
      } else {
        handleSolanaBridge(bridgeQuote.transactionRequest)
      }
    } else if (swapRequired) {
      if (!swapQuote) {
        form.setError("root", {
          message: "Couldn't fetch quote",
        })
        return
      }
      if (swapAllowanceRequired) {
        await switchChainAndInvoke(chain.id, () =>
          handleApproveSwap({
            address: USDCE_L2_TOKEN.address,
            args: [
              swapQuote.estimate.approvalAddress as `0x${string}`,
              BigInt(swapQuote?.estimate.fromAmount ?? UNLIMITED_ALLOWANCE),
            ],
          }),
        )
      } else {
        await switchChainAndInvoke(chain.id, () =>
          handleSwap(
            // @ts-ignore
            {
              ...swapQuote.transactionRequest,
              type: "legacy",
            },
          ),
        )
      }
    } else if (allowanceRequired) {
      await switchChainAndInvoke(chain.id, () =>
        handleApprove({
          address: USDC_L2_TOKEN.address,
          args: [
            process.env.NEXT_PUBLIC_PERMIT2_CONTRACT as `0x${string}`,
            UNLIMITED_ALLOWANCE,
          ],
        }),
      )
    } else {
      await switchChainAndInvoke(chain.id, () =>
        handleDeposit({
          amount,
          mint,
          onSuccess: handleDepositSuccess,
        }),
      )
    }
  }

  const stepList: (Step | undefined)[] = React.useMemo(() => {
    return steps.map((step) => {
      switch (step) {
        case EVMStep.APPROVE_BRIDGE:
          return {
            type: "transaction",
            txHash: approveBridgeHash,
            mutationStatus: approveBridgeStatus,
            txStatus: approveBridgeConfirmationStatus,
            label: STEP_CONFIGS[EVMStep.APPROVE_BRIDGE].label,
            chainId: STEP_CONFIGS[EVMStep.APPROVE_BRIDGE].chainId,
          }
        case SVMStep.SOURCE_BRIDGE:
          return {
            type: "transaction",
            txHash: solanaBridgeHash as `0x${string}`,
            mutationStatus: solanaBridgeStatus,
            txStatus: solanaConfirmationStatus,
            label: STEP_CONFIGS[SVMStep.SOURCE_BRIDGE].label,
            chainId: STEP_CONFIGS[SVMStep.SOURCE_BRIDGE].chainId,
          }
        case SVMStep.DESTINATION_BRIDGE:
          return {
            type: "lifi",
            lifiExplorerLink: solanaBridgeExecutionStatus?.lifiExplorerLink,
            txHash: solanaBridgeExecutionStatus?.receiveHash as `0x${string}`,
            txStatus: normalizeStatus(solanaBridgeExecutionStatus?.status),
            label: STEP_CONFIGS[SVMStep.DESTINATION_BRIDGE].label,
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
        case EVMStep.APPROVE_SWAP:
          return {
            type: "transaction",
            txHash: approveSwapHash,
            mutationStatus: approveSwapStatus,
            txStatus: approveSwapConfirmationStatus,
            label: STEP_CONFIGS[EVMStep.APPROVE_SWAP].label,
          }
        case EVMStep.SWAP:
          return {
            type: "transaction",
            txHash: swapHash,
            mutationStatus: swapStatus,
            txStatus: swapConfirmationStatus?.status,
            label: STEP_CONFIGS[EVMStep.SWAP].label,
          }
        case EVMStep.APPROVE_DEPOSIT:
          return {
            type: "transaction",
            txHash: approveHash,
            mutationStatus: approveStatus,
            txStatus: approveConfirmationStatus,
            label: STEP_CONFIGS[EVMStep.APPROVE_DEPOSIT].label,
          }
        case EVMStep.DEPOSIT:
          return {
            type: "task",
            mutationStatus: depositStatus,
            taskStatus: depositTaskStatus,
            label: STEP_CONFIGS[EVMStep.DEPOSIT].label,
          }
        default:
          return undefined
      }
    })
  }, [
    approveBridgeConfirmationStatus,
    approveBridgeHash,
    approveBridgeStatus,
    approveConfirmationStatus,
    approveHash,
    approveStatus,
    approveSwapConfirmationStatus,
    approveSwapHash,
    approveSwapStatus,
    bridgeExecutionStatus?.lifiExplorerLink,
    bridgeExecutionStatus?.receiveHash,
    bridgeExecutionStatus?.status,
    bridgeHash,
    bridgeStatus,
    depositStatus,
    depositTaskStatus,
    sendBridgeConfirmationStatus,
    solanaBridgeExecutionStatus?.lifiExplorerLink,
    solanaBridgeExecutionStatus?.receiveHash,
    solanaBridgeExecutionStatus?.status,
    solanaBridgeHash,
    solanaBridgeStatus,
    solanaConfirmationStatus,
    steps,
    swapConfirmationStatus?.status,
    swapHash,
    swapStatus,
  ])

  const execution = React.useMemo(
    () =>
      ({
        steps: stepList,
        token: USDC_L2_TOKEN,
      }) satisfies Execution,
    [stepList],
  )

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

    if (swapRequired) {
      return (
        <>
          <Separator />
          <ReviewSwap
            error={swapQuoteError}
            quote={swapQuote}
          />
        </>
      )
    }

    return userHasUsdcL1Balance ? (
      <BridgePromptEthereum
        hasBalance={userHasUsdcL1Balance}
        onClick={() => {
          if (Number(formattedUsdcL1Balance)) {
            setNetwork(mainnet.id)
            form.setValue("amount", formattedUsdcL1Balance, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        }}
      />
    ) : (
      <BridgePromptSolana
        hasUSDC={userHasUsdcSolanaBalance}
        onClick={() => {
          if (Number(formattedUsdcSolanaBalance)) {
            setNetwork(solana.id)
            form.setValue("amount", formattedUsdcSolanaBalance, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        }}
      />
    )
  }

  let buttonText = ""
  if (bridgeRequired) {
    buttonText = "Bridge & Deposit"
  } else if (swapRequired) {
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
    !mint || maxValue === "0" || amount.toString() === maxValue

  const isSubmitDisabled =
    !form.formState.isValid ||
    isMaxBalances ||
    (swapRequired && (isQuoteFetching || !swapQuote)) ||
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

    let title = "Depositing USDC"

    if (
      stepList.some(
        (step) =>
          step?.mutationStatus === "error" ||
          (step?.type === "task" && step.taskStatus === "Failed") ||
          switchChainError,
      )
    ) {
      title = "Failed to deposit USDC"
    } else if (
      (swapRequired && isQuoteFetching) ||
      (bridgeRequired && bridgeQuoteFetchStatus === "fetching")
    ) {
      title = "Fetching quote"
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
          <ScrollArea className="max-h-[70vh]">
            <div className={cn("flex flex-col gap-6", className)}>
              <div
                className={cn("flex flex-col space-y-2", {
                  hidden: !userHasUsdcL1Balance && !userHasUsdcSolanaBalance,
                })}
              >
                <Label>Network</Label>
                <NetworkSelect
                  hasEthereumBalance={userHasUsdcL1Balance}
                  hasSolanaBalance={userHasUsdcSolanaBalance}
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
                              if (Number(maxValue)) {
                                form.setValue("amount", maxValue, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                            }}
                          >
                            MAX
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
                    Balance on&nbsp;
                    <NetworkLabel chainId={chain.id} />
                  </div>
                  <div className="flex items-center">
                    <TooltipButton
                      className="h-5 p-0 font-mono text-sm"
                      tooltipContent={`${formattedUsdcL2Balance} ${USDC_L2_TOKEN?.ticker}`}
                      variant="link"
                      onClick={() => {
                        if (Number(formattedUsdcL2Balance)) {
                          setNetwork(chain.id)
                          form.setValue("amount", formattedUsdcL2Balance, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                      }}
                    >
                      {USDC_L2_TOKEN
                        ? `${formattedUsdcL2BalanceLabel} ${USDC_L2_TOKEN.ticker}`
                        : "--"}
                    </TooltipButton>
                  </div>
                </div>
                <div className="text-right">
                  <TooltipButton
                    className="h-5 p-0 font-mono text-sm"
                    tooltipContent={`${formattedUsdceL2Balance} USDC.e`}
                    variant="link"
                    onClick={() => {
                      if (Number(formattedCombinedBalance)) {
                        setNetwork(chain.id)
                        form.setValue("amount", formattedCombinedBalance, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    }}
                  >
                    {`${usdceL2BalanceLabel} USDC.e`}
                  </TooltipButton>
                </div>
              </div>

              <div
                className={cn("flex justify-between", {
                  hidden: !userHasUsdcSolanaBalance,
                })}
              >
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  Balance on&nbsp;
                  <NetworkLabel chainId={solana.id} />
                </div>
                <div className="flex items-center">
                  <TooltipButton
                    className="h-5 p-0 font-mono text-sm"
                    tooltipContent={`${usdcSolanaBalanceLabel} USDC`}
                    variant="link"
                    onClick={() => {
                      if (Number(formattedUsdcSolanaBalance)) {
                        setNetwork(solana.id)
                        form.setValue("amount", formattedUsdcSolanaBalance, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    }}
                  >
                    {`${usdcSolanaBalanceLabel} USDC`}
                  </TooltipButton>
                </div>
              </div>

              <div
                className={cn("flex justify-between", {
                  hidden: !userHasUsdcL1Balance,
                })}
              >
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  Balance on&nbsp;
                  <NetworkLabel chainId={mainnet.id} />
                </div>
                <TooltipButton
                  className="h-5 p-0 font-mono text-sm"
                  tooltipContent={formattedUsdcL1Balance}
                  variant="link"
                  onClick={() => {
                    if (Number(formattedUsdcL1Balance)) {
                      setNetwork(mainnet.id)
                      form.setValue("amount", formattedUsdcL1Balance, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  }}
                >
                  {USDC_L1_TOKEN
                    ? `${usdcL1BalanceLabel} ${USDC_L1_TOKEN.ticker}`
                    : "--"}
                </TooltipButton>
              </div>

              {renderTransferOptions()}

              <MaxBalancesWarning
                className="text-sm text-orange-400 transition-all duration-300 ease-in-out"
                mint={mint}
              />
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
                  className="flex w-full flex-col items-center justify-center whitespace-normal text-pretty border-l-0 font-extended text-lg"
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
