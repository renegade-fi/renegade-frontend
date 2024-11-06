"use client"

import * as React from "react"

import { Smartphone } from "lucide-react"

import { ConnectWalletButton } from "@/app/components/connect-wallet-button"
import { ArbitrumWalletActionsDropdown } from "@/app/components/wallet-sidebar/arbitrum-wallet-actions-dropdown"
import { AssetsMenu } from "@/app/components/wallet-sidebar/assets-menu"
import { PWADialog } from "@/app/components/wallet-sidebar/pwa-dialog"
import { RenegadeWalletActionsDropdown } from "@/app/components/wallet-sidebar/renegade-wallet-actions-dropdown"
import { SolanaMenuItem } from "@/app/components/wallet-sidebar/solana/menu-item"
import { WalletButton } from "@/app/components/wallet-sidebar/wallet-button"

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
} from "@/components/ui/sidebar"

import { useMediaQuery } from "@/hooks/use-media-query"
import { WalletReadyState, useWallets } from "@/hooks/use-wallets"
import { cn } from "@/lib/utils"

export function WalletSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { renegadeWallet, arbitrumWallet, walletReadyState } = useWallets()
  const isPWA = useMediaQuery("(display-mode: standalone)")

  return (
    <Sidebar
      {...props}
      className="pb-[79px]"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        {walletReadyState === WalletReadyState.READY ? (
          <>
            <WalletButton
              dropdownContent={
                <RenegadeWalletActionsDropdown wallet={renegadeWallet} />
              }
              wallet={renegadeWallet}
            />
            <WalletButton
              dropdownContent={
                <ArbitrumWalletActionsDropdown wallet={arbitrumWallet} />
              }
              wallet={arbitrumWallet}
            />
          </>
        ) : (
          <ConnectWalletButton />
        )}
      </SidebarHeader>
      <SidebarContent className="border-b">
        <SidebarGroup>
          <SidebarGroupLabel>Renegade</SidebarGroupLabel>
          <SidebarMenu>
            <AssetsMenu />
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Bridge & Deposit</SidebarGroupLabel>
          <SolanaMenuItem />
        </SidebarGroup>
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
  )
}
