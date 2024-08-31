"use client"

import React from "react"

import Image from "next/image"

import { Bug } from "lucide-react"

import { cn } from "@/lib/utils"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        reset()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [reset])
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-1/3 flex-col items-center justify-center gap-4 text-pretty rounded-lg p-6 text-center text-sm">
        <Bug className="text-red-price" />
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          We&apos;re on it, but feel free to reach out by clicking the button in
          the bottom right.
        </p>
        <Image
          alt="spinning-renegade"
          height={450}
          src="/r.gif"
          width={800}
        />
        <div className="flex flex-col">
          <p>
            Press{" "}
            <span
              className={cn(
                "center h-5 w-fit min-w-[1.25rem] rounded-md border border-foreground/20 px-1 text-xs text-foreground/50",
              )}
            >
              <span>↩</span>
            </span>{" "}
            to refresh
          </p>
          <p className="text-muted-foreground">
            or reach out to{" "}
            <a href="mailto:support@renegade.fi">support@renegade.fi</a>
          </p>
        </div>
      </div>
    </div>
  )
}
