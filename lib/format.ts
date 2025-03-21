import { OrderState, UseStatusReturnType } from "@renegade-fi/react"
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import relativeTime from "dayjs/plugin/relativeTime"
import numeral from "numeral"
import { formatUnits, parseUnits } from "viem"

import { oneMinute, oneHour } from "@/lib/constants/time"

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const formatRelativeTimestamp = (timestamp: number) => {
  return dayjs(timestamp).fromNow()
}

export const precisionFormatter = new Intl.NumberFormat("en", {
  notation: "standard",
  // @ts-ignore
  roundingPriority: "morePrecision",
  maximumSignificantDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
})

export const longPrecisionFormatter = new Intl.NumberFormat("en", {
  notation: "standard",
  // @ts-ignore
  roundingPriority: "morePrecision",
  maximumSignificantDigits: 4,
  maximumFractionDigits: 4,
  useGrouping: false,
})

export const formatNumber = (
  amount: bigint = BigInt(0),
  decimals: number,
  long: boolean = false,
) => {
  const formattedAmount = amount ? formatUnits(amount, decimals) : "0"
  const parsedAmount = parseFloat(formattedAmount)
  if (parsedAmount === 0 || isNaN(Number(formattedAmount))) {
    return "0"
  }

  return long
    ? longPrecisionFormatter.format(parsedAmount)
    : precisionFormatter.format(parsedAmount)
}

export const formatCurrency = (value: number): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  if (value > 0 && value < 0.01) {
    return `<${formatter.format(0.01)}`
  }
  return formatter.format(value)
}

export const formatCurrencyFromString = (n: string): string => {
  return formatCurrency(Number(n))
}

export const formatTimestamp = (
  timestamp: number,
  locale: string = "en-US",
) => {
  return new Date(timestamp).toLocaleString(locale, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export const percentageFormatter = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 2,
  useGrouping: false,
})

export const formatPercentage = (
  numerator: number,
  denominator: number,
  precision: number = 2,
  includeSymbol: boolean = true,
): string => {
  if (denominator === 0 || numerator === 0) {
    return includeSymbol ? percentageFormatter.format(0) : "0"
  }

  const value = numerator / denominator
  return includeSymbol
    ? percentageFormatter.format(value)
    : percentageFormatter.format(value).replace("%", "")
}

export const formatOrderState = {
  [OrderState.Created]: "Open",
  [OrderState.Matching]: "Open",
  [OrderState.Cancelled]: "Cancelled",
  [OrderState.Filled]: "Filled",
  [OrderState.SettlingMatch]: "Settling Order...",
} as const

export const formatStatus = (status: UseStatusReturnType) => {
  switch (status) {
    case "in relayer":
      return "Connected"
    case "connecting":
      return "Connecting"
    case "creating wallet":
      return "Creating wallet"
    case "disconnected":
      return "Disconnected"
    default:
      return "Unknown"
  }
}

export const safeParseUnits = (value: number | string, decimals: number) => {
  try {
    let valueStr: string
    if (typeof value === "number") {
      valueStr = value.toString()
      if (valueStr.includes("e")) {
        valueStr = Number(value).toLocaleString("fullwide", {
          useGrouping: false,
          maximumFractionDigits: decimals,
        })
      }
    } else {
      valueStr = value
    }
    return parseUnits(valueStr, decimals)
  } catch (error) {
    return Error("Failed to parse units")
  }
}

// Format timestamp in a human readable format
export function formatTimestampReadable(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < oneMinute) return `${Math.floor(ms / 1000)}s`
  if (ms < oneHour) {
    const minutes = Math.floor(ms / oneMinute)
    const seconds = Math.floor((ms % oneMinute) / 1000)
    return `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(ms / oneHour)
  const minutes = Math.floor((ms % oneHour) / oneMinute)
  return `${hours}h ${minutes}m`
}

export function formatStat(volume: number) {
  return numeral(volume).format("$0,0.00a")
}

export const truncateAddress = (address: string, chars: number = 4) => {
  if (!address || address.length <= chars * 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatDuration(ms: number | undefined): string | undefined {
  if (!ms) return undefined
  return dayjs.duration(ms, "milliseconds").humanize()
}
