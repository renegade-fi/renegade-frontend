import Image from "next/image"

import { ExternalLinkIcon } from "lucide-react"

export function Row({
  label,
  value,
  imageUri,
  url,
}: {
  label: string
  value: string | React.ReactNode
  imageUri?: string
  url?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {imageUri && (
          <Image
            alt=""
            className="flex-shrink-0"
            height={16}
            src={imageUri}
            width={16}
          />
        )}
        {typeof value === "string" ? <span>{value}</span> : value}
        {url && <ExternalLinkIcon className="h-4 w-4" />}
      </div>
    </div>
  )
}
