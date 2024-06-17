import { TailwindIndicator } from '@/app/tailwind-indicator'
import { ThemeProvider } from '@/components/theme-provider'
import { Token, tokenMapping } from '@renegade-fi/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
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
  return (
    <html lang="en">
      <body
        className={`${fontSansExtended.variable} ${fontSerif.variable} ${fontSans.variable} ${fontSansLight.variable} ${fontMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TailwindIndicator />
          <div className="flex min-h-screen flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
