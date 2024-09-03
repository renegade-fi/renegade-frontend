import { Metadata } from "next/types"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { isTestnet } from "@/lib/viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = (path = "") => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
      process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_SITE_URL
      : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
      process?.env?.NEXT_PUBLIC_VERCEL_URL &&
        process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ""
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : // If neither is set, default to localhost for local development.
        "http://localhost:3000"

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, "")
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, "")

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url
}

export const fundWallet = async (
  tokens: { ticker: string; amount: string }[],
  address: `0x${string}`,
) => {
  if (isTestnet) {
    await fetch(`/api/faucet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tokens,
        address,
      }),
    })
  }
}

export const fundList: { ticker: string; amount: string }[] = [
  { ticker: "WETH", amount: "3" },
  { ticker: "USDC", amount: "10000" },
  {
    ticker: "WBTC",
    amount: "0.2",
  },
  {
    ticker: "BNB",
    amount: "17",
  },
  {
    ticker: "MATIC",
    amount: "10000",
  },
  {
    ticker: "LDO",
    amount: "5000",
  },
  {
    ticker: "LINK",
    amount: "700",
  },
  {
    ticker: "UNI",
    amount: "1250",
  },
  {
    ticker: "SUSHI",
    amount: "5000",
  },
  {
    ticker: "1INCH",
    amount: "10000",
  },
  {
    ticker: "AAVE",
    amount: "120",
  },
  {
    ticker: "COMP",
    amount: "180",
  },
  {
    ticker: "MKR",
    amount: "3.75",
  },
  {
    ticker: "MANA",
    amount: "10000",
  },
  {
    ticker: "ENS",
    amount: "700",
  },
  {
    ticker: "DYDX",
    amount: "3333",
  },
  {
    ticker: "CRV",
    amount: "10000",
  },
]

export function constructMetadata({
  title = `Renegade Testnet | On-Chain Dark Pool`,
  description = `Trade any ERC-20 with zero price impact. Renegade is a MPC-based dark pool, delivering zero slippage cryptocurrency trades via anonymous crosses at midpoint prices.`,
  image = "/opengraph.png",
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string | null
  noIndex?: boolean
} = {}): Metadata {
  return {
    title: {
      template: "%s | Renegade",
      default: "Trade | Renegade",
    },
    description,
    openGraph: {
      title,
      description,
      url: process.env.NEXT_PUBLIC_URL,
      ...(image && {
        images: [
          {
            url: image,
          },
        ],
      }),
    },
    twitter: {
      title,
      description,
      ...(image && {
        card: "summary_large_image",
        images: [image],
      }),
      creator: "@renegade_fi",
    },
    metadataBase: new URL("https://trade.renegade.fi"),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}

export function adjustPriceDecimals(
  price: number,
  baseDecimals: number,
  quoteDecimals: number,
): number {
  const adjustedPrice = price * Math.pow(10, baseDecimals - quoteDecimals)
  return adjustedPrice
}