export interface GlowTextProps {
  text: string
  className?: string
}

export function GlowText({ text, className = '' }: GlowTextProps) {
  // const blurLevels = ['xs', 'md', 'xl']

  return (
    <div>
      <span className="absolute mx-auto box-content flex w-fit select-none border bg-green-price bg-clip-text font-extrabold text-transparent blur-sm">
        {text}
      </span>
      <span className="absolute mx-auto box-content flex w-fit select-none border bg-green-price bg-clip-text font-extrabold text-transparent blur-md">
        {text}
      </span>
      {/* <span className="absolute mx-auto box-content flex w-fit select-none border bg-green-price bg-clip-text font-extrabold text-transparent blur-xl">
        {text}
      </span> */}
      <h1 className="relative top-0 flex h-auto w-fit select-auto items-center justify-center bg-green-price bg-clip-text font-extrabold text-transparent">
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
