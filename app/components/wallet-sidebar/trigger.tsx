import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

import { useWallets } from "@/hooks/use-wallets"

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  const { arbitrumWallet: wallet } = useWallets()

  return (
    <Button
      className="group gap-2"
      variant="outline"
      onClick={toggleSidebar}
    >
      <span className="flex items-center justify-center gap-2">
        <Avatar className="h-4 w-4">
          {wallet.icon && (
            <AvatarImage
              alt={wallet.name}
              src={wallet.icon}
            />
          )}
          <AvatarFallback className="rounded-lg bg-[hsl(var(--chart-blue))]" />
        </Avatar>
        {wallet.label}
      </span>
    </Button>
  )
}
