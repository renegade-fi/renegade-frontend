import { Plus } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface ConnectDialogProps {
  children: React.ReactNode
}

export function ConnectDialog({ children }: ConnectDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              size="lg"
            >
              <Avatar className="h-8 w-8 rounded-lg border-[1px] border-dashed border-muted-foreground/50 bg-muted/50">
                <AvatarFallback className="rounded-lg bg-transparent">
                  <Plus className="h-4 w-4 text-muted-foreground/50" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-muted-foreground">
                  Connect Solana Wallet
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  To bridge & deposit USDC
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DialogTrigger>
      {children}
    </Dialog>
  )
}
