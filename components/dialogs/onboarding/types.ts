import { MutationStatus } from "@tanstack/react-query"

export type Step = {
  label: string
  status: MutationStatus
  error?: string
}

export const NonDeterministicWalletError = new Error(
  "Nondeterministic wallets are not supported on Renegade",
)

export function isNonDeterministicWalletError(error?: string) {
  return error === NonDeterministicWalletError.message
}

export enum ConnectSuccess {
  CREATE_WALLET,
  LOOKUP_WALLET,
  ALREADY_INDEXED,
}
