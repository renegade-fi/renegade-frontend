import { type ClassValue, clsx } from "clsx";
import type { Metadata } from "next/types";
import { twMerge } from "tailwind-merge";

import { env } from "@/env/client";
import { isTestnet } from "@/lib/viem";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getURL = (path = "") => {
    // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
    let url =
        env.NEXT_PUBLIC_SITE_URL.trim() !== ""
            ? env.NEXT_PUBLIC_SITE_URL
            : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
              env.NEXT_PUBLIC_VERCEL_URL && env.NEXT_PUBLIC_VERCEL_URL.trim() !== ""
              ? env.NEXT_PUBLIC_VERCEL_URL
              : // If neither is set, default to localhost for local development.
                "http://localhost:3000";

    // Trim the URL and remove trailing slash if exists.
    url = url.replace(/\/+$/, "");
    // Make sure to include `https://` when not localhost.
    url = url.includes("http") ? url : `https://${url}`;
    // Ensure path starts without a slash to avoid double slashes in the final URL.
    path = path.replace(/^\/+/, "");

    // Concatenate the URL and the path.
    return path ? `${url}/${path}` : url;
};

export const fundWallet = async (
    tokens: { ticker: string; amount: string }[],
    address: `0x${string}`,
    chainId?: number,
) => {
    if (isTestnet) {
        await fetch(`/api/faucet`, {
            body: JSON.stringify({
                address,
                chainId,
                tokens,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });
    }
};

export const fundList: { ticker: string; amount: string }[] = [
    { amount: "3", ticker: "WETH" },
    { amount: "10000", ticker: "USDC" },
    {
        amount: "0.2",
        ticker: "WBTC",
    },
    {
        amount: "17",
        ticker: "BNB",
    },
    {
        amount: "10000",
        ticker: "MATIC",
    },
    {
        amount: "5000",
        ticker: "LDO",
    },
    {
        amount: "700",
        ticker: "LINK",
    },
    {
        amount: "1250",
        ticker: "UNI",
    },
    {
        amount: "5000",
        ticker: "SUSHI",
    },
    {
        amount: "10000",
        ticker: "1INCH",
    },
    {
        amount: "120",
        ticker: "AAVE",
    },
    {
        amount: "180",
        ticker: "COMP",
    },
    {
        amount: "3.75",
        ticker: "MKR",
    },
    {
        amount: "10000",
        ticker: "MANA",
    },
    {
        amount: "700",
        ticker: "ENS",
    },
    {
        amount: "3333",
        ticker: "DYDX",
    },
    {
        amount: "10000",
        ticker: "CRV",
    },
];

export function constructMetadata({
    title = `Renegade Testnet | On-Chain Dark Pool`,
    description = `Trade any ERC-20 with zero price impact. Renegade is a MPC-based dark pool, delivering zero slippage cryptocurrency trades via anonymous crosses at midpoint prices.`,
    image = "/opengraph.png",
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string | null;
    noIndex?: boolean;
} = {}): Metadata {
    return {
        description,
        icons: {
            apple: [{ sizes: "180x180", type: "image/png", url: "/icons/apple-icon.png" }],
            icon: [
                { sizes: "32x32", type: "image/png", url: "/icons/icon1.png" },
                { sizes: "16x16", type: "image/png", url: "/icons/icon2.png" },
            ],
            shortcut: "/icons/apple-icon.png",
        },
        metadataBase: new URL("https://trade.renegade.fi"),
        openGraph: {
            description,
            title,
            url: env.NEXT_PUBLIC_SITE_URL,
            ...(image && {
                images: [
                    {
                        url: image,
                    },
                ],
            }),
        },
        title: {
            default: "Trade | Renegade",
            template: "%s | Renegade",
        },
        twitter: {
            description,
            title,
            ...(image && {
                card: "summary_large_image",
                images: [image],
            }),
            creator: "@renegade_fi",
        },
        ...(noIndex && {
            robots: {
                follow: false,
                index: false,
            },
        }),
        appleWebApp: {
            startupImage: [
                {
                    media: "screen and (orientation: portrait)",
                    url: "/startup/apple-touch-startup-image-1179x2556.png",
                },
            ],
            statusBarStyle: "black",
            title: "Renegade",
        },
    };
}

// Inverse of decimalCorrectPrice
export function decimalNormalizePrice(
    price: number,
    baseDecimals: number,
    quoteDecimals: number,
): number {
    const decimalDiff = baseDecimals - quoteDecimals;
    const normalizedPrice = price * 10 ** decimalDiff;
    return normalizedPrice;
}

// Decimal correct a price for a given token pair
export function decimalCorrectPrice(price: number, baseDecimals: number, quoteDecimals: number) {
    const decimalDiff = quoteDecimals - baseDecimals;
    const correctedPrice = price * 10 ** decimalDiff;

    return correctedPrice;
}
