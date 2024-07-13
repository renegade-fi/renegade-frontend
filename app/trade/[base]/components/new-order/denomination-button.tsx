import React from 'react'

import { ArrowRightLeft } from 'lucide-react'

import { setUseUSDC } from '@/app/trade/[base]/actions'

import { Button } from '@/components/ui/button'

export function DenominationButton({
  base,
  isUSDCDenominated: initialState,
  onClearAmount,
}: {
  base: string
  isUSDCDenominated?: boolean
  onClearAmount: () => void
}) {
  const [isUSDCDenominated, setIsUSDCDenominated] =
    React.useState(!!initialState)
  React.useEffect(() => {
    setUseUSDC(isUSDCDenominated)
  }, [isUSDCDenominated])
  return (
    <Button
      variant="ghost"
      className="h-12 flex-1 rounded-none p-0 px-2 font-serif text-2xl font-bold"
      onClick={() => {
        setIsUSDCDenominated(!isUSDCDenominated)
        onClearAmount()
      }}
    >
      {isUSDCDenominated ? 'USDC' : base}
      <ArrowRightLeft className="ml-2 h-5 w-5" />
    </Button>
  )
}
