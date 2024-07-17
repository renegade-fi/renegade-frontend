'use client'

import Image from 'next/image'

import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons'
import { Book } from 'lucide-react'

export function Footer() {
  return (
    <footer className="fixed bottom-0 z-10 min-w-full border-t bg-background">
      <div className="grid min-h-20 grid-cols-2 items-center">
        <div className="pl-6">
          <Image
            src="/logo_dark.svg"
            alt="logo"
            width="192"
            height="30"
            priority
          />
        </div>
        <div className="flex space-x-4 justify-self-end pr-6">
          <TwitterLogoIcon className="h-6 w-6" />
          <DiscordLogoIcon className="h-6 w-6" />
          <GitHubLogoIcon className="h-6 w-6" />
          <Book className="h-6 w-6" />
        </div>
      </div>
    </footer>
  )
}
