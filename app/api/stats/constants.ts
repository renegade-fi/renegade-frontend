export const INFLOWS_SET_KEY = "stats:inflows:set"
export const INFLOWS_KEY = "stats:inflows"
export const LAST_PROCESSED_BLOCK_KEY = "stats:inflows:last_processed_block"
export const BLOCK_CHUNK_SIZE = 10 // Adjust this value based on rate limit constraints

export type ExternalTransferData = {
  timestamp: number
  amount: number
  isWithdrawal: boolean
  mint: string
  transactionHash: string
}

export type BucketData = {
  timestamp: string
  depositAmount: number
  withdrawalAmount: number
}

// Volume

export const HISTORICAL_VOLUME_KEY_PREFIX = "stats:historical-volume"
export const HISTORICAL_VOLUME_SET_KEY = "stats:historical-volume:set"

// Flows

export const NET_FLOW_KEY = "net_flow_24h"
