import { useConfig, useStatus } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { Copy, LogOut } from "lucide-react"
import { useAccount, useDisconnect } from "wagmi"

import { Button } from "@/components/ui/button"
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

export function AccountDropdown({ children }: { children: React.ReactNode }) {
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
            <TooltipTrigger asChild>
              <Button
                className="h-fit w-fit p-0"
                variant="link"
                onClick={handleCopyAddress}
              >
                {truncatedAddress}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-sans">Copy address</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
