import React from 'react'
import { cn } from '@/lib/utils'

export interface GlowTextProps {
  text: string
  className?: string
}

export function GlowText({ text, className = '' }: GlowTextProps) {
  const blurLevels = ['xs', 'md', 'xl']

  return (
    <div>
      {blurLevels.map((level, index) => (
        <span
          key={index}
          className={cn(
            'absolute select-none bg-clip-text font-extrabold text-transparent',
            className,
            `blur-${level}`,
          )}
        >
          {text}
        </span>
      ))}
      <span className={cn(className, 'bg-clip-text text-transparent')}>
        {text}
      </span>
    </div>
  )
}
