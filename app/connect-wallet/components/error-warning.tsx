import { X } from "lucide-react"

export function ErrorWarning({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div className="flex items-center justify-center space-x-2 rounded-md bg-[#2A0000] p-3 text-sm text-red-500">
      <X className="h-4 w-4 text-red-500" />
      <div className="text-red-500">{error}</div>
    </div>
  )
}
