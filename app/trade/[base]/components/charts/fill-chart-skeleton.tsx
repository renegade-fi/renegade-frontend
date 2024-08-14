export function FillChartSkeleton() {
  return (
    <div className="p-6">
      <div className="relative h-[500px]">
        <div className="absolute bottom-0 left-0 top-0 w-12">
          <div className="h-full w-[2px] animate-pulse bg-primary/20" />
        </div>
        <div className="absolute bottom-0 left-[2px] right-0">
          <div className="h-[2px] w-full animate-pulse bg-primary/20" />
        </div>
        <svg className="absolute inset-0 h-full w-full">
          <path
            d="M20,350 Q145,150 270,250 T520,200"
            className="animate-pulse fill-none stroke-primary/20 stroke-2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  )
}
