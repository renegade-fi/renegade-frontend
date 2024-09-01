"use client"

import { useConfig, useStatus, useWalletId } from "@renegade-fi/react"
import { refreshWallet } from "@renegade-fi/react/actions"
import { toast } from "sonner"
import { useLocalStorage } from "usehooks-ts"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { STORAGE_REMEMBER_ME } from "@/lib/constants/storage"
import {
  FAILED_REFRESH_WALLET_MSG,
  START_REFRESH_WALLET_MSG,
} from "@/lib/constants/task"

export function SettingsPopover({ children }: { children: React.ReactNode }) {
  const config = useConfig()
  const status = useStatus()
  const walletId = useWalletId()
  const handleRefreshWallet = async () => {
    if (status === "in relayer") {
      await refreshWallet(config)
        .then(() => toast.message(START_REFRESH_WALLET_MSG))
        .catch(() => toast.message(FAILED_REFRESH_WALLET_MSG))
    }
  }
  const [rememberMe, setRememberMe] = useLocalStorage(
    STORAGE_REMEMBER_ME,
    false,
    {
      initializeWithValue: false,
    },
  )
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-none"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            {/* <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Animate banners</Label>
              <Checkbox
                defaultChecked
                className="justify-self-end"
              />
            </div> */}
            {/* <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Order panel left side</Label>
              <Checkbox
                defaultChecked
                className="justify-self-end"
              />
            </div> */}
            {/* <div className="grid grid-cols-3 items-center gap-4">
              <Label
                className="col-span-2"
                htmlFor="animate"
              >
                Skip order confirmation
              </Label>
              <Checkbox className="justify-self-end" />
            </div> */}
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="remember-me">Remember me</Label>
              <Checkbox
                checked={rememberMe}
                className="justify-self-end"
                id="remember-me"
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") {
                    setRememberMe(checked)
                  }
                }}
              />
            </div>
            {/* <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Dark mode</Label>
              <Checkbox
                defaultChecked
                className="justify-self-end"
              />
            </div> */}
          </div>
          <Separator />
          <div className="grid gap-2">
            {/* <Button
              variant="link"
              className="h-fit w-fit p-0"
            >
              Reset layout
            </Button>
            <Button
              variant="link"
              className="h-fit w-fit p-0"
            >
              Terms and Conditions
            </Button> */}
            <Button
              className="h-fit w-fit p-0"
              variant="link"
              onClick={handleRefreshWallet}
            >
              Refresh wallet
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-fit w-fit p-0 font-mono text-xs"
                  variant="link"
                  onClick={() => {
                    if (walletId) {
                      navigator.clipboard.writeText(walletId)
                    }
                  }}
                >
                  {walletId}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-sans">Copy wallet ID</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
