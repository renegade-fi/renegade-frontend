import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Token } from "@renegade-fi/token-nextjs"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DefaultForm } from "@/components/dialogs/transfer/default-form"
import {
  ExternalTransferDirection,
  formSchema,
} from "@/components/dialogs/transfer/helpers"
import { USDCForm } from "@/components/dialogs/transfer/usdc-form"
import { WETHForm } from "@/components/dialogs/transfer/weth-form"

import { useChainId } from "@/hooks/use-chain-id"
import { useIsBase } from "@/hooks/use-is-base"
import { resolveAddress, resolveTickerAndChain } from "@/lib/token"
import { isTestnet } from "@/lib/viem"

export function TransferForm({
  className,
  direction,
  initialMint,
  onSuccess,
  header,
}: React.ComponentProps<"form"> & {
  direction: ExternalTransferDirection
  initialMint?: string
  onSuccess: () => void
  header: React.ReactNode
}) {
  const isBase = useIsBase()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      mint: initialMint ?? "",
    },
  })
  // @sehyunc TODO: enable bridge/swap/wrap for Base when implemented
  if (isTestnet || isBase) {
    return (
      <DefaultForm
        className={className}
        direction={direction}
        form={form}
        header={header}
        onSuccess={onSuccess}
      />
    )
  }

  const mint = form.watch("mint")
  const token = resolveAddress(mint as `0x${string}`)
  if (token.ticker === "WETH") {
    return (
      <WETHForm
        className={className}
        direction={direction}
        form={form}
        header={header}
        onSuccess={onSuccess}
      />
    )
  }
  if (direction === ExternalTransferDirection.Deposit) {
    if (token.ticker === "USDC") {
      return (
        <USDCForm
          className={className}
          form={form}
          header={header}
          onSuccess={onSuccess}
        />
      )
    }
  }
  return (
    <DefaultForm
      className={className}
      direction={direction}
      form={form}
      header={header}
      onSuccess={onSuccess}
    />
  )
}
