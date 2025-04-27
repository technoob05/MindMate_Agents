"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      "glass-morphism",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-2 w-full grow overflow-hidden rounded-full",
        "bg-secondary/20",
        "glass-morphism"
      )}
    >
      <SliderPrimitive.Range className={cn(
        "absolute h-full bg-primary",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary-foreground/20 before:to-transparent",
        "before:animate-[shimmer_2s_infinite]"
      )} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "hover:bg-primary/10 hover:border-primary/80",
        "glass-morphism",
        "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-primary/20 before:via-transparent before:to-transparent",
        "before:opacity-0 before:transition-opacity hover:before:opacity-100"
      )}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
