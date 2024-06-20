import { setSide } from '@/app/trade/[base]/actions'
import { Button } from '@/components/ui/button'

export function SideButton({ side }: { side: string }) {
  return (
    <Button
      variant="outline"
      className="flex-1 border-l-0 font-serif text-3xl font-bold"
      size="xl"
      onClick={() => setSide(side === 'buy' ? 'sell' : 'buy')}
    >
      {side.toUpperCase()}
    </Button>
  )
}
