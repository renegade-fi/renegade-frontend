import { mainnet } from "viem/chains"

import { solana } from "@/lib/viem"

export enum EVMStep {
  APPROVE_BRIDGE = "APPROVE_BRIDGE",
  SOURCE_BRIDGE = "EVM_SOURCE_BRIDGE",
  DESTINATION_BRIDGE = "EVM_DESTINATION_BRIDGE",
  APPROVE_SWAP = "APPROVE_SWAP",
  SWAP = "SWAP",
  APPROVE_DEPOSIT = "APPROVE_DEPOSIT",
  DEPOSIT = "DEPOSIT",
}

export enum SVMStep {
  SOURCE_BRIDGE = "SVM_SOURCE_BRIDGE",
  DESTINATION_BRIDGE = "SVM_DESTINATION_BRIDGE",
}

export type TransferStep = EVMStep | SVMStep

export interface StepConfig {
  label: string
  chainId?: number
}

export const STEP_CONFIGS: Record<TransferStep, StepConfig> = {
  [EVMStep.APPROVE_BRIDGE]: {
    label: "Approve Bridge",
    chainId: mainnet.id,
  },
  [EVMStep.SOURCE_BRIDGE]: {
    label: "Source chain transaction",
    chainId: mainnet.id,
  },
  [EVMStep.DESTINATION_BRIDGE]: {
    label: "Destination chain transaction",
  },
  [EVMStep.APPROVE_SWAP]: {
    label: "Approve Swap",
  },
  [EVMStep.SWAP]: {
    label: "Swap USDC.e to USDC",
  },
  [EVMStep.APPROVE_DEPOSIT]: {
    label: "Approve Deposit",
  },
  [EVMStep.DEPOSIT]: {
    label: "Deposit USDC",
  },
  [SVMStep.SOURCE_BRIDGE]: {
    label: "Source chain transaction",
    chainId: solana.id,
  },
  [SVMStep.DESTINATION_BRIDGE]: {
    label: "Destination chain transaction",
  },
}
