"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    animated?: boolean
  }
>(
  (
    { className, orientation = "horizontal", decorative = true, animated = false, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "relative shrink-0",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        "glass-morphism bg-border/50",
        animated && [
          "after:absolute after:inset-0",
          "after:animate-shimmer",
          "after:bg-gradient-to-r after:from-transparent after:via-foreground/10 after:to-transparent",
          orientation === "horizontal" 
            ? "after:w-[200%] after:-translate-x-full" 
            : "after:h-[200%] after:-translate-y-full after:bg-gradient-to-b"
        ],
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
