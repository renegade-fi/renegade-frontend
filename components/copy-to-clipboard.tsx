import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

import { cn } from "@/lib/utils"

export function CopyToClipboard({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard")
      })
      .catch(err => {
        console.error("Failed to copy text: ", err)
      })
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            onClick={() => copyToClipboard(text)}
            className={cn("cursor-pointer", className)}
          >
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to copy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
