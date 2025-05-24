import Next from "next"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DD_ENV: string
      DD_SERVICE: string
      DD_APP_KEY: string
      DD_API_KEY: string
      NEXT_PUBLIC_AMBERDATA_PROXY_URL: string
      NEXT_PUBLIC_DATADOG_APPLICATION_ID: string
      NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: string
      NEXT_PUBLIC_INTERCOM_APP_ID: string
      NEXT_PUBLIC_PRICE_REPORTER_URL: string
      NEXT_PUBLIC_RPC_URL: string
      NEXT_PUBLIC_TOKEN_MAPPING: string
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: string
    }
  }
}
