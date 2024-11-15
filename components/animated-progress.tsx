import React from "react"

import * as ProgressPrimitive from "@radix-ui/react-progress"

export function AnimatedProgress() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex w-full flex-col gap-2 pt-3">
      <div className="relative">
        <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <ProgressPrimitive.Indicator
            className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-out"
            style={{ transform: `translateX(-${100 - (progress || 0)}%)` }}
          />
        </ProgressPrimitive.Root>

        {/* Arrow indicator */}
        <div
          className="absolute top-0 transition-all duration-300 ease-out"
          style={{
            left: `${progress}%`,
            transform: `translateX(-50%) translateY(-8px)`,
          }}
        >
          <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-t-[6px] border-primary border-l-transparent border-r-transparent" />
        </div>
      </div>

      <div className="flex w-full justify-between text-sm text-muted-foreground">
        <span>Privacy</span>
        <span>Speed</span>
      </div>
    </div>
  )
}
