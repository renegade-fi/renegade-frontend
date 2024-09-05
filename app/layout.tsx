import localFont from "next/font/local"
import { headers } from "next/headers"
import Script from "next/script"
import { userAgent } from "next/server"

import { cookieToInitialState as renegadeCookieToInitialState } from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Analytics } from "@vercel/analytics/react"

import { ClearCookie } from "@/app/components/clear-cookie"
import { LazyDatadog } from "@/app/components/datadog"
import { Faucet } from "@/app/components/faucet"
import { InvalidateQueries } from "@/app/components/invalidate-queries"
import { OrderToaster } from "@/app/components/order-toaster"
import { TailwindIndicator } from "@/app/components/tailwind-indicator"
import { TaskToaster } from "@/app/components/task-toaster"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { constructMetadata } from "@/lib/utils"
import { isTestnet } from "@/lib/viem"
import { config as renegadeConfig } from "@/providers/renegade-provider/config"
import { RenegadeProvider } from "@/providers/renegade-provider/renegade-provider"
import { SideProvider } from "@/providers/side-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { WagmiProvider } from "@/providers/wagmi-provider/wagmi-provider"

import "./globals.css"

const fontSansExtended = localFont({
  src: "../public/static/fonts/FavoritExtended.woff2",
  display: "swap",
  variable: "--font-sans-extended",
})

const fontSerif = localFont({
  src: "../public/static/fonts/Aime-Regular.woff2",
  display: "swap",
  variable: "--font-serif",
})

const fontSans = localFont({
  src: "../public/static/fonts/Favorit.ttf",
  display: "swap",
  variable: "--font-sans",
})

const fontSansLight = localFont({
  src: "../public/static/fonts/FavoritLight.ttf",
  display: "swap",
  variable: "--font-sans-light",
  weight: "200",
})

const fontMono = localFont({
  src: "../public/static/fonts/FavoritMono.ttf",
  display: "swap",
  variable: "--font-mono",
})

export const metadata = constructMetadata({
  title: isTestnet
    ? "Renegade Testnet | On-Chain Dark Pool"
    : "Renegade | On-Chain Dark Pool",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const renegadeInitialState = renegadeCookieToInitialState(
    renegadeConfig,
    headers().get("cookie"),
  )
  const { device } = userAgent({ headers: headers() })
  const prices = new Map()
  return (
    <html lang="en">
      <body
        className={`${fontSansExtended.variable} ${fontSerif.variable} ${fontSans.variable} ${fontSansLight.variable} ${fontMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          disableTransitionOnChange
          enableSystem
          attribute="class"
          defaultTheme="dark"
        >
          <RenegadeProvider initialState={renegadeInitialState}>
            <WagmiProvider cookie={headers().get("cookie") ?? undefined}>
              <TailwindIndicator />
              <TooltipProvider
                delayDuration={0}
                skipDelayDuration={0}
              >
                <SideProvider cookie={headers().get("cookie")}>
                  <div className="select-none">{children}</div>
                </SideProvider>
              </TooltipProvider>
              <Toaster
                className="pointer-events-auto"
                position="bottom-center"
                theme="light"
                toastOptions={{ duration: 5000 }}
                visibleToasts={MAX_ORDERS}
              />
              <InvalidateQueries />
              <OrderToaster />
              <TaskToaster />
              <ReactQueryDevtools initialIsOpen={false} />
              <Faucet />
              <LazyDatadog />
              <ClearCookie />
            </WagmiProvider>
          </RenegadeProvider>
        </ThemeProvider>
        <Analytics />
        <Script
          id="ze-snippet"
          src="https://static.zdassets.com/ekr/snippet.js?key=0093b78b-22e2-475a-a370-a15a4b7bf55c"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
