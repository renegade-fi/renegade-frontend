import * as React from "react"

import { usePathname, useRouter } from "next/navigation"

import { Token, UpdateType } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
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
import { useBasePerQuotePrice } from "@/hooks/use-base-per-usd-price"
import { useCheckChain } from "@/hooks/use-check-chain"
import { useDeposit } from "@/hooks/use-deposit"
import { useMaintenanceMode } from "@/hooks/use-maintenance-mode"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usePriceQuery } from "@/hooks/use-price-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { useWrapEth } from "@/hooks/use-wrap-eth"
import { MIN_DEPOSIT_AMOUNT, Side } from "@/lib/constants/protocol"
import { constructStartToastMessage } from "@/lib/constants/task"
import { formatNumber } from "@/lib/format"
import { useReadErc20BalanceOf } from "@/lib/generated"
import { cn } from "@/lib/utils"
import { useSide } from "@/providers/side-provider"

import { WrapEthWarning } from "./wrap-eth-warning"

// Assume direction is deposit and mint is WETH
export function WETHForm({
  className,
  form,
  onSuccess,
}: React.ComponentProps<"form"> & {
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

  const { data: wethBalance, queryKey: wethBalanceQueryKey } =
    useReadErc20BalanceOf({
      address: baseToken?.address,
      args: [address ?? "0x"],
    })

  useRefreshOnBlock({ queryKey: wethBalanceQueryKey })

  const formattedWethBalance = baseToken
    ? formatEther(wethBalance ?? BigInt(0))
    : ""
  const wethBalanceLabel = baseToken
    ? formatNumber(wethBalance ?? BigInt(0), baseToken.decimals, true)
    : ""

  // ETH-specific logic
  const { data: ethBalance, queryKey: ethBalanceQueryKey } = useBalance({
    address,
  })
  const formattedEthBalance = formatEther(ethBalance?.value ?? BigInt(0))
  const ethBalanceLabel = formatNumber(ethBalance?.value ?? BigInt(0), 18, true)
  const basePerQuotePrice = useBasePerQuotePrice(baseToken?.address ?? "0x")

  // Calculate the minimum ETH to keep unwrapped for gas fees
  const minEthToKeepUnwrapped = basePerQuotePrice ?? BigInt(4e15)

  const combinedBalance =
    (wethBalance ?? BigInt(0)) + (ethBalance?.value ?? BigInt(0))
  const maxAmountToWrap = combinedBalance - minEthToKeepUnwrapped
  const formattedMaxAmountToWrap = formatEther(maxAmountToWrap)

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })

  const remainingEthBalance =
    parseEther(amount) > (wethBalance ?? BigInt(0))
      ? (ethBalance?.value ?? BigInt(0)) +
        (wethBalance ?? BigInt(0)) -
        parseEther(amount)
      : ethBalance?.value ?? BigInt(0)

  const hideMaxButton =
    !mint ||
    formattedMaxAmountToWrap === "0" ||
    amount.toString() === formattedMaxAmountToWrap

  const { handleDeposit, status: depositStatus } = useDeposit({
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
  })

  // If the amount is greater than the WETH balance, we need to wrap ETH
  const needsWrapEth = parseEther(amount) > (wethBalance ?? BigInt(0))

  const { checkChain } = useCheckChain()

  const router = useRouter()
  const pathname = usePathname()
  const isTradePage = pathname.includes("/trade")
  const queryClient = useQueryClient()
  // Ensure price is loaded
  usePriceQuery(baseToken?.address || "0x")
  const { setSide } = useSide()

  const [totalSteps, setTotalSteps] = React.useState(0)
  const [currentStep, setCurrentStep] = React.useState(0)

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
      balance: needsWrapEth ? combinedBalance : wethBalance,
    })
    if (!isBalanceSufficient) {
      form.setError("amount", {
        message: "Insufficient Arbitrum balance",
      })
      return
    }

    // Calculate total steps
    let steps = 1 // Deposit is always required
    if (needsWrapEth) steps++
    if (needsApproval) steps++
    setTotalSteps(steps)
    setCurrentStep(0)

    if (needsWrapEth) {
      const ethAmount = parseEther(values.amount) - (wethBalance ?? BigInt(0))
      wrapEth(formatEther(ethAmount))
    } else if (needsApproval) {
      handleApprove({
        onSuccess: () => {
          setCurrentStep((prev) => prev + 1)
          handleDeposit({
            onSuccess: handleDepositSuccess,
          })
        },
      })
    } else {
      handleDeposit({
        onSuccess: handleDepositSuccess,
      })
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
    setSide(baseToken?.ticker === "USDC" ? Side.BUY : Side.SELL)
    if (isTradePage && baseToken?.ticker !== "USDC") {
      router.push(`/trade/${baseToken?.ticker}`)
    }
  }

  const { wrapEth, status: wrapStatus } = useWrapEth({
    onSuccess: () => {
      setCurrentStep((prev) => prev + 1)
      queryClient.invalidateQueries({ queryKey: ethBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: wethBalanceQueryKey })
      if (needsApproval) {
        handleApprove({
          onSuccess: () => {
            setCurrentStep((prev) => prev + 1)
            handleDeposit({
              onSuccess: handleDepositSuccess,
            })
          },
        })
      } else {
        handleDeposit({
          onSuccess: handleDepositSuccess,
        })
      }
    },
    onError: (error) => {
      console.error("Error wrapping ETH:", error)
      // Reset steps on error
      setTotalSteps(0)
      setCurrentStep(0)
    },
  })

  const { data: maintenanceMode } = useMaintenanceMode()

  let buttonText = ""
  let buttonTextInParentheses = ""
  if (needsWrapEth) {
    if (wrapStatus === "pending") {
      buttonText = "Confirm in wallet"
      buttonTextInParentheses = `(${currentStep + 1} of ${totalSteps})`
    } else if (needsApproval) {
      buttonText = "Wrap, Approve & Deposit"
    } else {
      buttonText = "Wrap & Deposit"
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
                            form.setValue("amount", formattedMaxAmountToWrap, {
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
                          form.setValue("amount", formattedWethBalance, {
                            shouldValidate: true,
                          })
                        }}
                      >
                        <div className="font-mono text-sm">
                          {baseToken
                            ? `${wethBalanceLabel} ${baseToken.ticker}`
                            : "--"}
                        </div>
                      </Button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent>
                      {`${formattedWethBalance} ${baseToken?.ticker}`}
                    </ResponsiveTooltipContent>
                  </ResponsiveTooltip>
                </div>
              </div>
              <div className="text-right">
                <ResponsiveTooltip>
                  <ResponsiveTooltipTrigger
                    asChild
                    className={cn(
                      "!pointer-events-auto",
                      ethBalance?.value &&
                        minEthToKeepUnwrapped > ethBalance.value
                        ? ""
                        : "cursor-pointer",
                    )}
                  >
                    <Button
                      className="h-5 p-0"
                      disabled={
                        ethBalance?.value
                          ? minEthToKeepUnwrapped > ethBalance.value
                          : false
                      }
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
                  <ResponsiveTooltipContent>
                    {ethBalance?.value &&
                    minEthToKeepUnwrapped > ethBalance.value
                      ? "Not enough ETH to wrap"
                      : `${formattedEthBalance} ETH`}
                  </ResponsiveTooltipContent>
                </ResponsiveTooltip>
                <span className="font-mono text-sm">&nbsp;</span>
              </div>
            </div>
            <MaxBalancesWarning
              className="text-sm text-orange-400 transition-all duration-300 ease-in-out"
              mint={mint}
            />
            {needsWrapEth && (
              <WrapEthWarning
                minEthToKeepUnwrapped={minEthToKeepUnwrapped}
                remainingEthBalance={remainingEthBalance}
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
                    isMaxBalances ||
                    wrapStatus === "pending" ||
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
                  className="flex w-full flex-col items-center justify-center whitespace-normal text-pretty border-l-0 font-extended text-lg"
                  disabled={
                    !form.formState.isValid ||
                    isMaxBalances ||
                    wrapStatus === "pending" ||
                    approveStatus === "pending" ||
                    depositStatus === "pending" ||
                    (maintenanceMode?.enabled &&
                      maintenanceMode.severity === "critical")
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
