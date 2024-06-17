'use client'

import { ModeToggle } from '@/components/mode-toggle.tsx'
import { cn } from '@/lib/utils'
import { Package2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

export function Header() {
  const params = useParams<{ quoterKey: string }>()
  const pathname = usePathname()
  return (
    <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Package2 className="h-6 w-6" />
          <span className="sr-only">Renegade</span>
        </Link>
        <Link
          href="/"
          className={cn(
            'transition-colors hover:text-foreground',
            pathname === '/' ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          Home
        </Link>
        <Link
          href={`/quoter`}
          className={cn(
            'transition-colors hover:text-foreground',
            pathname === '/quoter'
              ? 'text-foreground'
              : 'text-muted-foreground',
          )}
        >
          Quoters
        </Link>
      </nav>
      <ModeToggle />
    </header>
  )
}
