import { setSide } from '@/app/trade/[base]/actions'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'

export function SideButton({ side }: { side: string }) {
  return (
    <Button
      variant="outline"
      className="flex-1 border-l-0 font-serif text-2xl font-bold"
      size="xl"
      onClick={() => setSide(side === 'buy' ? 'sell' : 'buy')}
    >
      {side.toUpperCase()}
      <ArrowRightLeft className="ml-2 h-4 w-4" />
    </Button>
  )
}
