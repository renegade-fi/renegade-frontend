import { cn } from '@/lib/utils'

export interface GlowTextProps {
  enabled?: boolean
  text: string
  className?: string
}

export function GlowText({ className, enabled = true, text }: GlowTextProps) {
  // const blurLevels = ['xs', 'md', 'xl']

  return (
    <div>
      <span
        className={cn(
          'absolute mx-auto box-content flex w-fit select-none border bg-clip-text font-extrabold text-transparent blur-sm',
          className,
          enabled ? 'blur-sm' : 'blur-0',
          {
            hidden: !enabled,
          },
        )}
      >
        {text}
      </span>
      <span
        className={cn(
          'absolute mx-auto box-content flex w-fit select-none border bg-clip-text font-extrabold text-transparent blur-md',
          className,
          enabled ? 'blur-md' : 'blur-0',
          {
            hidden: !enabled,
          },
        )}
      >
        {text}
      </span>
      {/* <span className="absolute mx-auto box-content flex w-fit select-none border bg-green-price bg-clip-text font-extrabold text-transparent blur-xl">
        {text}
      </span> */}
      <h1
        className={cn(
          'relative top-0 flex h-auto w-fit select-auto items-center justify-center bg-clip-text text-transparent',
          enabled ? className : '',
          {
            'text-inherit': !enabled,
            'font-extrabold': enabled,
          },
        )}
      >
        {text}
      </h1>
    </div>
    // <div>
    //   {blurLevels.map((level, index) => (
    //     <span
    //       key={index}
    //       className={cn(
    //         'absolute select-none bg-clip-text font-extrabold text-transparent',
    //         className,
    //         `blur-${level}`,
    //       )}
    //     >
    //       {text}
    //     </span>
    //   ))}
    //   <span className={cn(className, 'bg-clip-text text-transparent')}>
    //     {text}
    //   </span>
    // </div>
  )
}
