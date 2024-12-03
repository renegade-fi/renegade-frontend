import { useMemo } from "react"

interface TokenConfig {
  allocation: number // Quoter's allocation in USDC
  firstFillAmount: number // Amount that can be filled instantly
  rematchDelayMs: number // Delay between fill attempts
  fillDurations: {
    first: number // Duration for first fills in ms
    normal: number // Duration for normal fills in ms
    priority: number // Duration for priority fills in ms
  }
}

// Token allocations in USDC
const TOKEN_ALLOCATIONS: Record<string, number> = {
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
  firstFillAmount: 1000, // Default first fill amount
  rematchDelayMs: 60_000, // 1 minute between fills
  fillDurations: {
    first: 1_000, // 1 second
    normal: 30_000, // 30 seconds
    priority: 54_000, // 54 seconds
  },
}

// Token-specific configurations (override defaults)
const TOKEN_CONFIGS: Partial<
  Record<string, Partial<Pick<TokenConfig, "firstFillAmount">>>
> = {
  WETH: {
    firstFillAmount: 3000,
  },
  WBTC: {
    firstFillAmount: 3000,
  },
  PENDLE: {
    firstFillAmount: 1000,
  },
}

interface TimeToFillParams {
  amount: number // Amount in USDC
  baseToken: string // Base token identifier (e.g., "WETH")
}

export function useTimeToFill({ amount, baseToken }: TimeToFillParams): number {
  return useMemo(() => {
    // Get token allocation or use minimum allocation as default
    const allocation = baseToken
      ? TOKEN_ALLOCATIONS[baseToken] ??
        Math.min(...Object.values(TOKEN_ALLOCATIONS))
      : Math.min(...Object.values(TOKEN_ALLOCATIONS))

    // Get token-specific config overrides or use defaults
    const config = {
      ...DEFAULT_CONFIG,
      ...(baseToken ? TOKEN_CONFIGS[baseToken] : {}),
      allocation,
    }

    // If amount is less than or equal to first fill threshold, return first fill duration
    if (amount <= config.firstFillAmount) {
      return config.fillDurations.first
    }

    // Calculate remaining amount after first fill
    const remainingAmount = amount - config.firstFillAmount

    // Determine if this is a priority fill (amount > 2x allocation)
    const isPriorityFill = amount > allocation * 2

    // Calculate fill amount per interval
    // For priority fills: use 2x allocation
    // For normal fills: use allocation
    const fillPerInterval = isPriorityFill ? allocation * 2 : allocation

    // Calculate number of intervals needed
    const intervalsNeeded = Math.ceil(remainingAmount / fillPerInterval)

    // Use appropriate fill duration based on priority
    const fillDuration = isPriorityFill
      ? config.fillDurations.priority
      : config.fillDurations.normal

    console.log("ttf debug: ", {
      first: config.fillDurations.first,
      fillDuration,
      intervalsNeeded,
      rematchDelayMs: config.rematchDelayMs,
      fillPerInterval,
      baseToken,
      allocation,
      isPriorityFill,
    })

    // Return total time in milliseconds (including initial first fill duration)
    return (
      config.fillDurations.first +
      intervalsNeeded * (config.rematchDelayMs + fillDuration)
    )
  }, [amount, baseToken])
}
