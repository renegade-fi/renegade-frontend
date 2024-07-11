'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Bell } from 'lucide-react'

import { TaskHistorySheet } from '@/app/components/task-history-sheet'

import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { TransferDialog } from '@/components/dialogs/transfer-dialog'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  return (
    <header className="fixed top-0 z-10 min-w-full border-b bg-background">
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
          <Link
            href="/trade/WETH"
            className={cn(
              'hover:underline',
              pathname.includes('/trade') ? 'text-primary' : '',
            )}
          >
            Trade
          </Link>
          <Link
            href="/assets"
            className={cn(
              'hover:underline',
              pathname.includes('/assets') ? 'text-primary' : '',
            )}
          >
            Assets
          </Link>
          <Link
            href="/orders"
            className={cn(
              'text-muted-foreground hover:underline',
              pathname.includes('/orders') ? 'text-primary' : '',
            )}
          >
            Orders
          </Link>
          <Link
            href="#"
            className={cn(
              'hover:underline',
              pathname === '/stats' ? 'text-primary' : '',
            )}
          >
            Stats
          </Link>
        </nav>
        <div className="flex items-center space-x-4 justify-self-end pr-4">
          <TaskHistorySheet>
            <Button
              variant="ghost"
              className="flex h-8 w-8 rounded-none p-0 data-[state=open]:bg-muted"
            >
              <Bell className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </TaskHistorySheet>
          <TransferDialog>
            <Button className="font-extended" variant="outline" size="sm">
              Deposit
            </Button>
          </TransferDialog>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
