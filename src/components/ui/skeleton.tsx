import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md glass-morphism animate-pulse",
        "bg-primary/5 dark:bg-primary/10",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "overflow-hidden relative",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
