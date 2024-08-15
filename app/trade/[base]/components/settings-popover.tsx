"use client"

import { useWalletId } from "@renegade-fi/react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export function SettingsPopover({ children }: { children: React.ReactNode }) {
  const walletId = useWalletId()
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 rounded-none">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Animate banners</Label>
              <Checkbox
                className="justify-self-end"
                defaultChecked
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Order panel left side</Label>
              <Checkbox
                className="justify-self-end"
                defaultChecked
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label
                className="col-span-2"
                htmlFor="animate"
              >
                Skip order confirmation
              </Label>
              <Checkbox className="justify-self-end" />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Remember me</Label>
              <Checkbox
                className="justify-self-end"
                defaultChecked
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="animate">Dark mode</Label>
              <Checkbox
                className="justify-self-end"
                defaultChecked
              />
            </div>
          </div>
          <Separator />
          <div className="grid gap-2">
            <Button
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
            </Button>
            <Button
              variant="link"
              className="h-fit w-fit p-0 font-mono text-xs"
            >
              {walletId}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
