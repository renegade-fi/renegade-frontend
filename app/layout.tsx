import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { headers } from 'next/headers'

import { cookieToInitialState as renegadeCookieToInitialState } from '@renegade-fi/react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { cookieToInitialState } from 'wagmi'

import { getInitialPrices } from '@/app/actions'
import { OrderToaster } from '@/app/components/order-toaster'
import { TailwindIndicator } from '@/app/components/tailwind-indicator'
import { TaskToaster } from '@/app/components/task-toaster'

import { Toaster } from '@/components/ui/sonner'

import { config as renegadeConfig } from '@/providers/renegade-provider/config'
import { RenegadeProvider } from '@/providers/renegade-provider/renegade-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { config } from '@/providers/wagmi-provider/config'
import { WagmiProvider } from '@/providers/wagmi-provider/wagmi-provider'
import { PriceStoreProvider } from '@/stores/price-store'

import './globals.css'

dayjs.extend(relativeTime)

const fontSansExtended = localFont({
  src: './FavoritExtended.woff2',
  display: 'swap',
  variable: '--font-sans-extended',
})

const fontSerif = localFont({
  src: './Aime-Regular.woff2',
  display: 'swap',
  variable: '--font-serif',
})

const fontSans = localFont({
  src: './Favorit.ttf',
  display: 'swap',
  variable: '--font-sans',
})

const fontSansLight = localFont({
  src: './FavoritLight.ttf',
  display: 'swap',
  variable: '--font-sans-light',
  weight: '200',
})

const fontMono = localFont({
  src: './FavoritMono.ttf',
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Renegade',
    default: 'Trade | Renegade',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialState = cookieToInitialState(config, headers().get('cookie'))
  const renegadeInitialState = renegadeCookieToInitialState(
    renegadeConfig,
    headers().get('cookie'),
  )
  // const prices = await getInitialPrices()
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
            <WagmiProvider initialState={initialState}>
              <PriceStoreProvider initialPrices={new Map()}>
                <TailwindIndicator />
                <div className="">{children}</div>
                <Toaster
                  className="pointer-events-auto"
                  toastOptions={{ duration: 10000 }}
                />
                <OrderToaster />
                <TaskToaster />
                <ReactQueryDevtools initialIsOpen={false} />
              </PriceStoreProvider>
            </WagmiProvider>
          </RenegadeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
