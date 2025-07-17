import { MAX_ORDERS } from "@renegade-fi/react/constants";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import type { Viewport } from "next/types";
import { cookieToInitialState } from "wagmi";

import { LazyDatadog } from "@/app/components/datadog";
import { Faucet } from "@/app/components/faucet";
import { Footer } from "@/app/components/footer";
import { Header } from "@/app/components/header";
import { InvalidateQueries } from "@/app/components/invalidate-queries";
import { OrderToaster } from "@/app/components/order-toaster";
import { TailwindIndicator } from "@/app/components/tailwind-indicator";
import { TaskToaster } from "@/app/components/task-toaster";
import { TrackLastVisit } from "@/app/components/track-last-visit";
import { WalletSidebar } from "@/app/components/wallet-sidebar";
import { WrongNetworkModal } from "@/app/components/wrong-network-modal";
import { Zendesk } from "@/app/components/zendesk";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletIndexCheck } from "@/components/wallet-index-check";

import { constructMetadata } from "@/lib/utils";
import { isTestnet } from "@/lib/viem";
import { WasmProvider } from "@/providers/renegade-provider/wasm-provider";
import { SolanaProvider } from "@/providers/solana-provider";
import { ClientStoreProvider } from "@/providers/state-provider/client-store-provider";
import { ServerStoreProvider } from "@/providers/state-provider/server-store-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { getConfig } from "@/providers/wagmi-provider/config";
import { WagmiProvider } from "@/providers/wagmi-provider/wagmi-provider";

import "./globals.css";

const fontSansExtended = localFont({
    display: "swap",
    src: "../public/static/fonts/FavoritExtended.woff2",
    variable: "--font-sans-extended",
});

const fontSerif = localFont({
    display: "swap",
    src: "../public/static/fonts/Aime-Regular.woff2",
    variable: "--font-serif",
});

const fontSans = localFont({
    display: "swap",
    src: "../public/static/fonts/Favorit.ttf",
    variable: "--font-sans",
});

const fontSansLight = localFont({
    display: "swap",
    src: "../public/static/fonts/FavoritLight.ttf",
    variable: "--font-sans-light",
    weight: "200",
});

const fontMono = localFont({
    display: "swap",
    src: "../public/static/fonts/FavoritMono.ttf",
    variable: "--font-mono",
});

export const metadata = constructMetadata({
    title: isTestnet ? "Renegade Testnet | On-Chain Dark Pool" : "Renegade | On-Chain Dark Pool",
});

export const viewport: Viewport = {
    colorScheme: "dark",
    initialScale: 1,
    maximumScale: 1,
    minimumScale: 1,
    themeColor: "#000000",
    userScalable: false,
    viewportFit: "cover",
    width: "device-width",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headersList = await headers();
    const cookieString = headersList.get("cookie")
        ? decodeURIComponent(headersList.get("cookie") ?? "")
        : "";
    const initialState = cookieToInitialState(getConfig(), cookieString);

    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${fontSansExtended.variable} ${fontSerif.variable} ${fontSans.variable} ${fontSansLight.variable} ${fontMono.variable} bg-background font-sans antialiased`}
            >
                <WasmProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        disableTransitionOnChange
                        enableSystem
                    >
                        <ServerStoreProvider cookieString={cookieString}>
                            <ClientStoreProvider>
                                <WagmiProvider initialState={initialState}>
                                    <SolanaProvider>
                                        <SidebarProvider defaultOpen={defaultOpen}>
                                            <TrackLastVisit />
                                            <TailwindIndicator />
                                            <TooltipProvider
                                                delayDuration={0}
                                                skipDelayDuration={0}
                                            >
                                                <SidebarInset className="max-w-full">
                                                    <Header />
                                                    {children}
                                                    <WalletIndexCheck />
                                                    <Footer />
                                                </SidebarInset>
                                            </TooltipProvider>
                                            <Toaster
                                                className="pointer-events-auto"
                                                theme="light"
                                                toastOptions={{ duration: 5000 }}
                                                visibleToasts={MAX_ORDERS}
                                            />
                                            <InvalidateQueries />
                                            <OrderToaster />
                                            <TaskToaster />
                                            <ReactQueryDevtools
                                                buttonPosition="bottom-left"
                                                initialIsOpen={false}
                                            />
                                            <Faucet />
                                            <LazyDatadog />
                                            <WalletSidebar side="right" />
                                            <WrongNetworkModal />
                                        </SidebarProvider>
                                    </SolanaProvider>
                                </WagmiProvider>
                            </ClientStoreProvider>
                        </ServerStoreProvider>
                    </ThemeProvider>
                </WasmProvider>
                <Analytics />
                <Zendesk />
            </body>
        </html>
    );
}
