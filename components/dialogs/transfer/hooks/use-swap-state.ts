import { useEffect, useState } from "react"

import { Token } from "@renegade-fi/react"
import { UseFormReturn, useWatch } from "react-hook-form"
import { parseUnits } from "viem"
import { z } from "zod"

import { formSchema } from "../helpers"

interface SwapState {
  swapRequired: boolean
  usdceToSwap?: string
  usdcBalance: bigint
}

const baseToken = Token.findByTicker("USDC")

export function useSwapState(
  form: UseFormReturn<z.infer<typeof formSchema>>,
  usdcBalance: bigint | undefined,
  usdceBalance: bigint | undefined,
) {
  const [snapshot, setSnapshot] = useState<SwapState>({
    swapRequired: false,
    usdceToSwap: undefined,
    usdcBalance: usdcBalance ?? BigInt(0),
  })

  const amount = useWatch({
    control: form.control,
    name: "amount",
  })

  useEffect(() => {
    const { unsubscribe } = form.watch((value, { name, type }) => {
      if (name === "amount") {
        const parsedAmount = parseUnits(value.amount ?? "0", baseToken.decimals)
        const combinedBalance =
          (usdcBalance ?? BigInt(0)) + (usdceBalance ?? BigInt(0))

        const swapRequired =
          parsedAmount > (usdcBalance ?? BigInt(0)) &&
          parsedAmount <= combinedBalance

        setSnapshot((prev) => ({
          ...prev,
          swapRequired,
          usdceToSwap: undefined,
          usdcBalance: BigInt(0),
        }))
      }
    })
    return () => unsubscribe()
  }, [form, usdcBalance, usdceBalance])

  const captureSnapshot = (formattedUsdcBalance: string) => {
    setSnapshot((prev) => ({
      ...prev,
      usdceToSwap: (
        parseFloat(amount) - parseFloat(formattedUsdcBalance)
      ).toFixed(6),
      usdcBalance: usdcBalance ?? BigInt(0),
    }))
  }

  return { snapshot, captureSnapshot }
}
