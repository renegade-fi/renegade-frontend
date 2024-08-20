import type { Metadata } from "next"
import localFont from "next/font/local"
import { headers } from "next/headers"

import { cookieToInitialState as renegadeCookieToInitialState } from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { getInitialPrices } from "@/app/actions"
import { Faucet } from "@/app/components/faucet"
import { InvalidateQueries } from "@/app/components/invalidate-queries"
import { OrderToaster } from "@/app/components/order-toaster"
import { TailwindIndicator } from "@/app/components/tailwind-indicator"
import { TaskToaster } from "@/app/components/task-toaster"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { IntercomProvider } from "@/providers/intercom-provider"
import { config as renegadeConfig } from "@/providers/renegade-provider/config"
import { RenegadeProvider } from "@/providers/renegade-provider/renegade-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { WagmiProvider } from "@/providers/wagmi-provider/wagmi-provider"
import { PriceStoreProvider } from "@/stores/price-store"

import "./globals.css"

dayjs.extend(relativeTime)

const fontSansExtended = localFont({
  src: "./FavoritExtended.woff2",
  display: "swap",
  variable: "--font-sans-extended",
})

const fontSerif = localFont({
  src: "./Aime-Regular.woff2",
  display: "swap",
  variable: "--font-serif",
})

const fontSans = localFont({
  src: "./Favorit.ttf",
  display: "swap",
  variable: "--font-sans",
})

const fontSansLight = localFont({
  src: "./FavoritLight.ttf",
  display: "swap",
  variable: "--font-sans-light",
  weight: "200",
})

const fontMono = localFont({
  src: "./FavoritMono.ttf",
  display: "swap",
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    template: "%s | Renegade",
    default: "Trade | Renegade",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const renegadeInitialState = renegadeCookieToInitialState(
    renegadeConfig,
    headers().get("cookie"),
  )
  // const prices = await getInitialPrices()
  const prices = new Map()
  return (
    <html lang="en">
      <body
        className={`${fontSansExtended.variable} ${fontSerif.variable} ${fontSans.variable} ${fontSansLight.variable} ${fontMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <RenegadeProvider initialState={renegadeInitialState}>
            <WagmiProvider cookie={headers().get("cookie") ?? undefined}>
              <PriceStoreProvider initialPrices={prices}>
                <TailwindIndicator />
                <TooltipProvider
                  delayDuration={0}
                  skipDelayDuration={0}
                >
                  <IntercomProvider>
                    <div className="">{children}</div>
                  </IntercomProvider>
                </TooltipProvider>
                <Toaster
                  className="pointer-events-auto"
                  toastOptions={{ duration: 5000 }}
                  position="bottom-center"
                  theme="light"
                  visibleToasts={MAX_ORDERS}
                />
                <InvalidateQueries />
                <OrderToaster />
                <TaskToaster />
                <ReactQueryDevtools initialIsOpen={false} />
                <Faucet />
              </PriceStoreProvider>
            </WagmiProvider>
          </RenegadeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
