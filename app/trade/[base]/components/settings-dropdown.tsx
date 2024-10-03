"use client"

import Image from "next/image"

import { useConfig, useStatus, useWalletId } from "@renegade-fi/react"
import { refreshWallet } from "@renegade-fi/react/actions"
import { Smartphone } from "lucide-react"
import { useLocalStorage } from "usehooks-ts"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useMediaQuery } from "@/hooks/use-media-query"
import { STORAGE_REMEMBER_ME } from "@/lib/constants/storage"
import { cn } from "@/lib/utils"

export function SettingsDropdown({ children }: { children: React.ReactNode }) {
  const config = useConfig()
  const status = useStatus()
  const walletId = useWalletId()
  const isPWA = useMediaQuery("(display-mode: standalone)")
  const handleRefreshWallet = async () => {
    if (status === "in relayer") {
      await refreshWallet(config)
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
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-fit rounded-none"
          side="bottom"
        >
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuItem
            className="grid grid-cols-2 items-center gap-4"
            onSelect={(e) => {
              e.preventDefault()
              setRememberMe(!rememberMe)
            }}
          >
            <Label>Remember me</Label>
            <Checkbox
              checked={rememberMe}
              className="justify-self-end"
              onCheckedChange={(checked) => {
                if (typeof checked === "boolean") {
                  setRememberMe(checked)
                }
              }}
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DialogTrigger
            asChild
            className={cn("lg:hidden", isPWA && "hidden")}
          >
            <DropdownMenuItem>Install Mobile App</DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem onSelect={handleRefreshWallet}>
            Refresh wallet
          </DropdownMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                className="text-nowrap font-mono text-xs"
                onSelect={() => {
                  if (walletId) {
                    navigator.clipboard.writeText(walletId)
                  }
                }}
              >
                {walletId}
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent
              className="font-sans"
              side="left"
            >
              Copy wallet ID
            </TooltipContent>
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>
      <PWADialog />
    </Dialog>
  )
}

function PWADialog() {
  return (
    <DialogContent className="h-dvh p-0">
      <div className="flex max-h-[calc(100dvh-88px)] flex-col items-center justify-center gap-4 overflow-y-scroll p-6 text-center text-sm">
        <DialogHeader className="flex flex-col items-center">
          <Smartphone className="mb-4 text-blue" />
          <DialogTitle>Install Mobile App</DialogTitle>
          <DialogDescription>
            Add the Renegade app to your home screen for a better mobile
            experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col border pt-4">
          <p className="text-lg">Tap the share icon</p>
          <p className="text-muted-foreground">
            in your browser&apos;s address bar.
          </p>
          <Image
            priority
            alt="share button"
            className="mt-4"
            height={100}
            src="/share.jpg"
            width={400}
          />
        </div>
        <div className="flex flex-col border pt-4">
          <p className="text-lg">Tap &quot;Add to Home Screen&quot;</p>
          <Image
            priority
            alt="add to home screen"
            className="mt-4"
            height={100}
            src="/add-to-home-screen.jpg"
            width={400}
          />
        </div>
      </div>
      <DialogFooter className="p-6 pt-0">
        <DialogClose asChild>
          <Button
            className="font-extended text-lg"
            size="xl"
            variant="outline"
          >
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
