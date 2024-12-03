import { useMemo } from "react"

interface TokenConfig {
  allocation: number // Quoter's allocation in USDC
  firstFillValue: number // Amount that can be filled instantly
  rematchDelayMs: number // Delay between fill attempts
  fillLatency: {
    first: number // Duration for first fills in ms
    normal: number // Duration for normal fills in ms
    priority: number // Duration for priority fills in ms
  }
}

// Token allocations in USDC
const ALLOCATIONS: Record<string, number> = {
  WBTC: 11000,
  WETH: 11000,
  ARB: 1000,
  GMX: 1000,
  PENDLE: 3250,
  LDO: 1000,
  LINK: 1000,
  CRV: 1000,
  UNI: 1000,
  ZRO: 1000,
  LPT: 1000,
  GRT: 1000,
  COMP: 1000,
  AAVE: 1000,
  XAI: 1000,
  RDNT: 1000,
  ETHFI: 1000,
}

// Default configuration
const DEFAULT_CONFIG: Omit<TokenConfig, "allocation"> = {
  firstFillValue: 1000, // Default first fill amount
  rematchDelayMs: 60_000, // 1 minute between fills
  fillLatency: {
    first: 1_000, // 1 second
    normal: 30_000, // TODO: Verify this
    priority: 54_000, // 54 seconds
  },
}

// Token-specific configurations (override defaults)
const TOKEN_CONFIGS: Partial<
  Record<string, Partial<Pick<TokenConfig, "firstFillValue">>>
> = {
  WETH: {
    firstFillValue: 3000,
  },
  WBTC: {
    firstFillValue: 3000,
  },
  PENDLE: {
    firstFillValue: 1000,
  },
}

interface TimeToFillParams {
  amount: number // Amount in USDC
  baseToken: string // Base token identifier (e.g., "WETH")
}

export function useTimeToFill({ amount, baseToken }: TimeToFillParams): number {
  return useMemo(() => {
    // Get token allocation or use minimum allocation as default
    const allocation = ALLOCATIONS[baseToken]

    // Get token-specific config overrides or use defaults
    const config = {
      ...DEFAULT_CONFIG,
      ...(baseToken ? TOKEN_CONFIGS[baseToken] : {}),
      allocation,
    }

    // If amount is less than or equal to first fill threshold, return first fill duration
    if (amount <= config.firstFillValue) {
      return config.fillLatency.first
    }

    // Calculate remaining amount after first fill
    const remainingAmount = amount - config.firstFillValue

    // Determine if this is a priority fill (amount > 2x allocation)
    const isPriorityFill = amount > allocation * 2

    // Calculate fill amount per interval
    // For priority fills: use 2x allocation
    // For normal fills: use allocation
    const fillPerInterval = isPriorityFill ? allocation * 2 : allocation

    // Calculate number of intervals needed
    const intervalsNeeded = Math.ceil(remainingAmount / fillPerInterval)

    // Use appropriate fill duration based on priority
    const fillLatency = isPriorityFill
      ? config.fillLatency.priority
      : config.fillLatency.normal

    // Return total time in milliseconds (including initial first fill duration)
    return (
      config.fillLatency.first +
      intervalsNeeded * (config.rematchDelayMs + fillLatency)
    )
  }, [amount, baseToken])
}
