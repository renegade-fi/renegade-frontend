import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Token } from "@renegade-fi/react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { DefaultForm } from "@/components/dialogs/transfer/default-form"
import {
  ExternalTransferDirection,
  formSchema,
} from "@/components/dialogs/transfer/helpers"
import { USDCForm } from "@/components/dialogs/transfer/usdc-form"
import { WETHForm } from "@/components/dialogs/transfer/weth-form"

export function TransferForm({
  className,
  direction,
  initialMint,
  onSuccess,
}: React.ComponentProps<"form"> & {
  direction: ExternalTransferDirection
  initialMint?: string
  onSuccess: () => void
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      mint: initialMint ?? "",
    },
  })
  if (direction === ExternalTransferDirection.Deposit) {
    if (form.watch("mint") === Token.findByTicker("WETH").address) {
      return (
        <WETHForm
          className={className}
          form={form}
          onSuccess={onSuccess}
        />
      )
    } else if (form.watch("mint") === Token.findByTicker("USDC").address) {
      return (
        <USDCForm
          className={className}
          form={form}
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
      onSuccess={onSuccess}
    />
  )
}
