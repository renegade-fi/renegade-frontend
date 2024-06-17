'use client'

import {
  Config,
  createConfig,
  createStorage,
  noopStorage,
} from '@renegade-fi/react'
import { createContext, useContext, useRef } from 'react'
import {
  createStore,
  useStore,
  type StateCreator,
  type StoreApi,
} from 'zustand'

const ConfigContext = createContext<StoreApi<any> | null>(null)

interface ConfigsState {
  configs: Map<string, Config>
  setConfig: (id: string, config: Config) => void
}

export const ConfigProvider = ({
  children,
  initialIds,
}: React.PropsWithChildren<{ initialIds: string[] }>) => {
  const storeRef = useRef<StoreApi<{ configs: Map<string, Config> }>>()
  if (!storeRef.current) {
    storeRef.current = createStore<ConfigsState>()(() => {
      const configs = new Map<string, Config>()
      initialIds.forEach(id => {
        configs.set(
          id,
          createConfig({
            darkPoolAddress: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
            priceReporterUrl: process.env.NEXT_PUBLIC_PRICE_REPORTER_URL,
            relayerUrl: process.env.NEXT_PUBLIC_RENEGADE_RELAYER_HOSTNAME,
            rpcUrl: '',
            ssr: true,
            storage: createStorage({ storage: noopStorage }),
          }),
        )
      })
      return { configs, setConfig: (id, config) => configs.set(id, config) }
    })
  }
  return (
    <ConfigContext.Provider value={storeRef.current}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfigContext = <T, U>(
  selector: (state: ConfigsState) => U,
): U => {
  const configContextValue = useContext(ConfigContext)
  if (!configContextValue)
    throw new Error('useConfigContext must be used within a ConfigProvider')

  return useStore(configContextValue, selector)
}
