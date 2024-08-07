"use client"

import LazyDatadog from "@/app/(desktop)/telemetry"
import { OrderToaster } from "@/app/order-toaster"
import { TaskToaster } from "@/app/task-toaster"
import { AppProvider } from "@/contexts/App/app-context"
import { chain, viemClient } from "@/lib/viem"
import { menuAnatomy } from "@chakra-ui/anatomy"
import { CacheProvider } from "@chakra-ui/next-js"
import {
  ChakraProvider,
  ColorModeScript,
  type ThemeConfig,
  createMultiStyleConfigHelpers,
  extendTheme,
  keyframes,
  useDisclosure,
} from "@chakra-ui/react"
import {
  RenegadeProvider,
  createConfig as createSDKConfig,
  useStatus,
} from "@renegade-fi/react"
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { PropsWithChildren, useEffect } from "react"
import { IntercomProvider } from "react-use-intercom"
import { Toaster } from "sonner"
import { useReadLocalStorage } from "usehooks-ts"
import { http } from "viem"
import { WagmiProvider, createConfig } from "wagmi"

import { CreateStepper } from "@/components/steppers/create-stepper/create-stepper"

dayjs.extend(relativeTime)

/*
 * ┌─────────────────────┐
 * │    Chakra Config    |
 * └─────────────────────┘
 */

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys)

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
}

const gradientShiftAimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
     background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`

const styles = {
  global: {
    body: {
      fontFamily: "Favorit Extended",
      fontWeight: "400",
      fontSize: "0.9em",
      color: "white",
      bg: "black",
    },
  },
}

const colors = {
  green: "#43e043",
  red: "#e04943",
  yellow: "#fecb33",
  brown: "#231f20",
  "brown.light": "#372f2f",
  "white.100": "#ffffff",
  "white.90": "#e6e6e6",
  "white.80": "#cccccc",
  "white.70": "#b3b3b3",
  "white.60": "#999999",
  "white.50": "#94938d",
  "white.40": "#666666",
  "white.30": "#4d4d4d",
  "white.20": "#333333",
  "white.10": "#1a1a1a",
  "white.5": "#0d0d0d",
  text: {
    primary: "#cccccc",
    secondary: "#999999",
    muted: "#666666",
  },
  surfaces: {
    1: "#1e1e1e",
  },
}

const menuStyle = definePartsStyle({
  list: {
    minWidth: "auto",
    padding: "0",
    background: "transparent",
  },
  item: {
    minWidth: "auto",
    padding: "0",
    background: "transparent",
    fontSize: "1.3em",
    color: "white.100",
    _hover: {
      background: "rgba(255, 255, 255, 0.05)",
    },
    _focus: {
      background: "rgba(255, 255, 255, 0.05)",
    },
  },
})

const components = {
  Text: {
    variants: {
      "status-green": {
        fontSize: "0.85em",
        fontWeight: "700",
        color: "green",
        textShadow: "0 0 5px green",
      },
      "status-red": {
        fontSize: "0.85em",
        fontWeight: "700",
        color: "red",
        textShadow: "0 0 5px red",
      },
      "status-gray": {
        fontSize: "0.85em",
        fontWeight: "700",
        color: "white.30",
      },
      "trading-body-button": {
        fontFamily: "Aime",
        fontSize: "1.3em",
        fontWeight: "700",
        color: "white.100",
      },
      "trading-body-button-blurred": {
        fontFamily: "Aime",
        fontSize: "1.3em",
        fontWeight: "700",
        color: "white.50",
      },
      "rotate-left": {
        lineHeight: "1",
        transform: "rotate(180deg)",
        writingMode: "vertical-rl",
        textOrientation: "sideways",
      },
      "rotate-right": {
        lineHeight: "1",
        writingMode: "vertical-rl",
        textOrientation: "sideways",
      },
      blurred: {
        filter: "blur(5px)",
        transition: "filter 0.3s ease-in-out",
      },
    },
  },
  Button: {
    variants: {
      "wallet-connect": {
        fontWeight: "400",
        fontSize: "1.1em",
        color: "white",
        background:
          "linear-gradient(135deg, #000000 0%,#3d3d3d 14%,#3d3d3d 14%,#111111 21%,#3d3d3d 39%,#010101 50%,#3d3d3d 61%,#161616 67%,#3d3d3d 80%,#212121 85%,#1b1b1b 100%)",
        backgroundSize: "400% 400%",
        animation: `${gradientShiftAimation} 45s ease infinite`,
        border: "var(--border)",
        borderColor: "white.20",
        _hover: {
          animationPlayState: "paused",
          borderColor: "white.60",
        },
      },
    },
  },
  Menu: defineMultiStyleConfig({ baseStyle: menuStyle }),
}
const theme = extendTheme({ config, styles, colors, components })

export const renegadeConfig = createSDKConfig({
  darkPoolAddress: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
  priceReporterUrl: process.env.NEXT_PUBLIC_PRICE_REPORTER_URL,
  relayerUrl: process.env.NEXT_PUBLIC_RENEGADE_RELAYER_HOSTNAME,
  ssr: true,
  viemClient,
})

/*
 * ┌─────────────────────┐
 * │    Wallet Config    |
 * └─────────────────────┘
 */
export const wagmiConfig = createConfig(
  getDefaultConfig({
    appDescription:
      "On-chain dark pool. MPC-based cryptocurrency DEX for anonymous crosses at midpoint prices.",
    appName: "Renegade | On-Chain Dark Pool",
    appIcon: "/glyph_light.svg",
    appUrl: "https://renegade.fi",
    chains: [chain],
    ssr: true,
    transports: {
      [chain.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  })
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: renegadeConfig.pollingInterval,
    },
  },
})

export function Providers({
  children,
  icons,
}: PropsWithChildren & {
  icons?: Record<string, string>
}) {
  const rememberMe = useReadLocalStorage<boolean>("rememberMe")
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!rememberMe) {
        window.localStorage.setItem("renegade.store", "")
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [rememberMe])

  // Invalidate query cache when the window loses focus
  useEffect(() => {
    focusManager.setEventListener((handleFocus) => {
      if (typeof window !== "undefined" && window.addEventListener) {
        const visibilitychangeHandler = () => {
          handleFocus(document.visibilityState === "visible")
        }
        const focusHandler = () => {
          handleFocus(document.hasFocus())
        }
        window.addEventListener(
          "visibilitychange",
          visibilitychangeHandler,
          false
        )
        window.addEventListener("focus", focusHandler, false)
        window.addEventListener("blur", focusHandler, false)
        return () => {
          window.removeEventListener(
            "visibilitychange",
            visibilitychangeHandler
          )
          window.removeEventListener("focus", focusHandler)
          window.removeEventListener("blur", focusHandler)
        }
      }
    })
  }, [])

  return (
    <>
      <IntercomProvider
        appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID}
        autoBoot
        initializeDelay={10000}
      >
        <CacheProvider>
          <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <RenegadeProvider
              reconnectOnMount={!!rememberMe}
              config={renegadeConfig}
            >
              <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                  <AppProvider tokenIcons={icons}>
                    <ConnectKitProviderWithSignMessage>
                      <Toaster position="bottom-center" richColors />
                      <TaskToaster />
                      <OrderToaster />
                      {children}
                      <LazyDatadog />
                      <ReactQueryDevtools initialIsOpen={false} />
                    </ConnectKitProviderWithSignMessage>
                  </AppProvider>
                </QueryClientProvider>
              </WagmiProvider>
            </RenegadeProvider>
          </ChakraProvider>
        </CacheProvider>
      </IntercomProvider>
    </>
  )
}

// Required because ConnectKitProvider needs access to the useSignMessage wagmi hook
function ConnectKitProviderWithSignMessage({ children }: PropsWithChildren) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const status = useStatus()
  return (
    <ConnectKitProvider
      onConnect={() => {
        if (status !== "in relayer") {
          onOpen()
        }
      }}
      mode="dark"
      customTheme={{
        "--ck-overlay-background": "rgba(0, 0, 0, 0.25)",
        "--ck-overlay-backdrop-filter": "blur(8px)",
        "--ck-font-family": "Favorit Extended",
        "--ck-border-radius": "10px",
        "--ck-body-background": "#1e1e1e",
        "--ck-spinner-color": "#ffffff",
      }}
    >
      {children}
      {isOpen && <CreateStepper onClose={onClose} />}
    </ConnectKitProvider>
  )
}
