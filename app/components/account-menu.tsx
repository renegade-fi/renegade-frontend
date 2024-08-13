import { useConfig } from "@renegade-fi/react"
import { disconnect as disconnectRenegade } from "@renegade-fi/react/actions"
import { LogOut } from "lucide-react"
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

export function DropdownMenuDemo({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const config = useConfig()
  const { disconnect } = useDisconnect()
  const truncatedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  const handleDisconnect = () => {
    disconnectRenegade(config)
    disconnect()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuLabel>{truncatedAddress}</DropdownMenuLabel>
          </TooltipTrigger>
          <TooltipContent>
            <span>{address}</span>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
