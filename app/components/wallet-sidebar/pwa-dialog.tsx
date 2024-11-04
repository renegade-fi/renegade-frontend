import Image from "next/image"

import { Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"

interface PWADialogProps {
  children: React.ReactNode
}

export function PWADialog({ children }: PWADialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
    </Dialog>
  )
}
