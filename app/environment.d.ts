import Next from 'next'
import { tokenMapping } from '@renegade-fi/react'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_BOT_SECRETS: string
      NEXT_PUBLIC_DARKPOOL_CONTRACT: `0x${string}`
      NEXT_PUBLIC_PRICE_REPORTER_URL: string
      NEXT_PUBLIC_PERMIT2_CONTRACT: `0x${string}`
      NEXT_PUBLIC_RENEGADE_RELAYER_HOSTNAME: string
      NEXT_PUBLIC_RPC_URL: string
      NEXT_PUBLIC_TOKEN_MAPPING: string
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
    }
  }
}
