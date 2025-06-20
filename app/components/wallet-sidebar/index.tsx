"use client";

import { Smartphone } from "lucide-react";
import type * as React from "react";

import { ArbitrumWalletActionsDropdown } from "@/app/components/wallet-sidebar/arbitrum-wallet-actions-dropdown";
import { AssetsMenuItem } from "@/app/components/wallet-sidebar/assets-menu-item";
import { ConnectWalletMenuItem } from "@/app/components/wallet-sidebar/connect-wallet-menu-item";
import { PWADialog } from "@/app/components/wallet-sidebar/pwa-dialog";
import { RecentFillsMenuItem } from "@/app/components/wallet-sidebar/recent-fills-menu-item";
import { RenegadeWalletActionsDropdown } from "@/app/components/wallet-sidebar/renegade-wallet-actions-dropdown";
import { ConnectContent } from "@/app/components/wallet-sidebar/solana/connect-content";
import { SolanaWalletActionsDropdown } from "@/app/components/wallet-sidebar/solana-wallet-actions-dropdown";
import { WalletButton } from "@/app/components/wallet-sidebar/wallet-button";

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";

import { useIsBase } from "@/hooks/use-is-base";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSignInAndConnect } from "@/hooks/use-sign-in-and-connect";
import { useWallets } from "@/hooks/use-wallets";
import { cn } from "@/lib/utils";

export function WalletSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const isPWA = useMediaQuery("(display-mode: standalone)");
    const { isMobile } = useSidebar();
    const { handleClick, open, onOpenChange } = useSignInAndConnect();
    const { solanaWallet, renegadeWallet, arbitrumWallet } = useWallets();
    const isBase = useIsBase();

    return (
        <>
            <Sidebar {...props} className="pb-[79px]">
                <SidebarHeader className="border-b border-sidebar-border">
                    {renegadeWallet.isConnected ? (
                        <WalletButton
                            dropdownContent={
                                <RenegadeWalletActionsDropdown wallet={renegadeWallet} />
                            }
                            wallet={renegadeWallet}
                        />
                    ) : (
                        <ConnectWalletMenuItem
                            subtitle=""
                            title="Sign in to Renegade"
                            onClick={handleClick}
                        />
                    )}
                    {arbitrumWallet.isConnected ? (
                        <WalletButton
                            dropdownContent={
                                <ArbitrumWalletActionsDropdown wallet={arbitrumWallet} />
                            }
                            wallet={arbitrumWallet}
                        />
                    ) : (
                        <ConnectWalletMenuItem
                            subtitle=""
                            title="Connect Wallet"
                            onClick={handleClick}
                        />
                    )}
                </SidebarHeader>
                <SidebarContent className="border-b">
                    <SidebarGroup>
                        <SidebarMenu>
                            <AssetsMenuItem />
                            <RecentFillsMenuItem />
                        </SidebarMenu>
                    </SidebarGroup>
                    {!isBase && (
                        <SidebarGroup className="mt-auto">
                            <SidebarGroupLabel>Bridge & Deposit</SidebarGroupLabel>
                            {solanaWallet.isConnected ? (
                                <WalletButton
                                    dropdownContent={
                                        <SolanaWalletActionsDropdown wallet={solanaWallet} />
                                    }
                                    wallet={solanaWallet}
                                />
                            ) : (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <ConnectWalletMenuItem
                                            subtitle="To bridge & deposit USDC"
                                            title="Connect Solana Wallet"
                                        />
                                    </DialogTrigger>
                                    <DialogContent
                                        className={isMobile ? "h-full w-full" : "w-[343px]"}
                                    >
                                        <ConnectContent />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </SidebarGroup>
                    )}
                </SidebarContent>
                <SidebarFooter className={cn("lg:hidden", isPWA && "hidden")}>
                    <SidebarMenu>
                        <PWADialog>
                            <SidebarMenuItem>
                                <SidebarMenuButton>
                                    <Smartphone />
                                    <span>Install Mobile App</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </PWADialog>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SignInDialog open={open} onOpenChange={onOpenChange} />
        </>
    );
}
