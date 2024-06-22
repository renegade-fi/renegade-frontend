'use client'

import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { TransferDialog } from '@/components/dialogs/transfer-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  return (
    <header className="fixed top-0 z-10 min-w-full bg-background">
      <div className="grid min-h-20 grid-cols-3 items-center">
        <div className="pl-6">
          <Image
            src="/glyph_dark.svg"
            alt="logo"
            width="31"
            height="38"
            priority
          />
        </div>
        <nav className="flex space-x-5 justify-self-center font-extended text-muted-foreground">
          <a
            href="/trade/WETH"
            className={cn(
              'hover:underline',
              pathname.includes('/trade') ? 'text-primary' : '',
            )}
          >
            Trade
          </a>
          <a
            href="/assets"
            className={cn(
              'hover:underline',
              pathname.includes('/assets') ? 'text-primary' : '',
            )}
          >
            Assets
          </a>
          <a
            href="/orders"
            className={cn(
              'text-muted-foreground hover:underline',
              pathname.includes('/orders') ? 'text-primary' : '',
            )}
          >
            Orders
          </a>
          <a
            href="#"
            className={cn(
              'hover:underline',
              pathname === '/stats' ? 'text-primary' : '',
            )}
          >
            Stats
          </a>
        </nav>
        <div className="flex items-center space-x-4 justify-self-end pr-4">
          <TransferDialog>
            <Button className="font-extended" variant="outline">
              Deposit
            </Button>
          </TransferDialog>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
