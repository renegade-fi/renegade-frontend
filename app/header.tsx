'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Header() {
  return (
    <header className="grid h-20 grid-cols-3 items-center">
      <div className="pl-6">
        <Image
          src="/glyph_dark.svg"
          alt="logo"
          width="31"
          height="38"
          priority
        />
      </div>
      <nav className="flex space-x-5 justify-self-center font-extended">
        <a href="#" className="hover:underline">
          Trade
        </a>
        <a href="#" className="text-muted-foreground hover:underline">
          Assets
        </a>
        <a href="#" className="text-muted-foreground hover:underline">
          Orders
        </a>
        <a href="#" className="text-muted-foreground hover:underline">
          Stats
        </a>
      </nav>
      <div className="flex items-center space-x-4 justify-self-end pr-4">
        <Button className="font-extended" variant="outline">
          Deposit
        </Button>
        <Button variant="shimmer" className="font-extended text-base">
          Connect Wallet
        </Button>
      </div>
    </header>
  )
}
