"use client"

import * as React from "react"

import { useConfig } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { PanelRightClose, Smartphone, X } from "lucide-react"
import { useDisconnect } from "wagmi"

import { ConnectWalletButton } from "@/app/components/connect-wallet-button"
import { ArbitrumWalletActionsDropdown } from "@/app/components/wallet-sidebar/arbitrum-wallet-actions-dropdown"
import { PWADialog } from "@/app/components/wallet-sidebar/pwa-dialog"
import { RenegadeWalletActionsDropdown } from "@/app/components/wallet-sidebar/renegade-wallet-actions-dropdown"
import { SolanaWalletButton } from "@/app/components/wallet-sidebar/solana/wallet-button"
import { WalletButton } from "@/app/components/wallet-sidebar/wallet-button"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
} from "@/components/ui/sidebar"

import { useMediaQuery } from "@/hooks/use-media-query"
import { WalletReadyState, useWallets } from "@/hooks/use-wallets"
import { cn } from "@/lib/utils"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const config = useConfig()
  const { disconnect } = useDisconnect()
  const { toggleSidebar } = useSidebar()
  const { renegadeWallet, arbitrumWallet, walletReadyState } = useWallets()
  const isPWA = useMediaQuery("(display-mode: standalone)")

  const handleDisconnect = () => {
    disconnectRenegade(config)
    disconnect()
  }

  return (
    <Sidebar
      {...props}
      // Align with footer
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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  size="lg"
                  onClick={handleDisconnect}
                >
                  <Avatar className="h-8 w-8 rounded-lg border-[1px] border-muted-foreground/50 bg-muted/50">
                    <AvatarFallback className="rounded-lg bg-transparent">
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="text-muted-foreground">Sign out</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        ) : (
          <ConnectWalletButton />
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Deposit wallet</SidebarGroupLabel>
          <SolanaWalletButton />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-b">
        <SidebarMenu>
          <PWADialog>
            <SidebarMenuItem className={cn("lg:hidden", isPWA && "hidden")}>
              <SidebarMenuButton>
                <Smartphone />
                <span>Install Mobile App</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </PWADialog>

          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar}>
              <PanelRightClose />
              <span>Close</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
