import { useConfig, useStatus } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { Copy, LogOut } from "lucide-react"
import { useAccount, useDisconnect } from "wagmi"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { formatStatus } from "@/lib/format"

export function DropdownMenuDemo({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const config = useConfig()
  const { disconnect } = useDisconnect()
  const status = useStatus()
  const truncatedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  const handleDisconnect = () => {
    disconnectRenegade(config)
    disconnect()
  }

  const handleCopyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <Tooltip>
            <TooltipTrigger>{truncatedAddress}</TooltipTrigger>
            <TooltipContent>
              <span>{address}</span>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuLabel>
          <span>Status: {formatStatus(status)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
