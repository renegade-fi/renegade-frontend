import { ReactNode } from "react"

import { LucideIcon } from "lucide-react"

interface IconTextProps {
  className?: string
  icon: LucideIcon
  iconClassName?: string
  iconPosition?: "left" | "right"
  word: ReactNode
}

export function IconText({
  className = "",
  icon: Icon,
  iconClassName = "size-4",
  iconPosition = "left",
  word,
}: IconTextProps) {
  const iconElement = (
    <Icon className={`relative top-[0.3em] inline-block ${iconClassName}`} />
  )

  return (
    <span className={`inline-flex items-baseline hover:text-blue ${className}`}>
      {iconPosition === "left" ? (
        <>
          {iconElement}
          <span className="">&nbsp;{word}</span>
        </>
      ) : (
        <>
          <span className="mr-1">{word}</span>
          {iconElement}
        </>
      )}
    </span>
  )
}
