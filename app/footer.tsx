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
    <footer className="flex items-center p-4">
      <Image src="/logo_dark.svg" alt="logo" width="192" height="30" priority />
      <div className="flex justify-between">
        <div className="flex space-x-4">
          <TwitterLogoIcon className="h-6 w-6" />
          <DiscordLogoIcon className="h-6 w-6" />
          <GitHubLogoIcon className="h-6 w-6" />
          <Book className="h-6 w-6" />
        </div>
      </div>
    </footer>
  )
}
