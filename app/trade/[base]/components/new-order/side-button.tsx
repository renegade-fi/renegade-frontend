'use client'

import React from 'react'

import { ArrowRightLeft } from 'lucide-react'

import { setSide as setSideCookies } from '@/app/trade/[base]/actions'

import { Button } from '@/components/ui/button'

export function SideButton({ side: initialSide }: { side: string }) {
  const [side, setSide] = React.useState(initialSide)

  React.useEffect(() => {
    setSideCookies(side as 'buy' | 'sell')
  }, [side])

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
