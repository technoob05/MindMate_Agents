import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "glass-morphism bg-primary/80 text-primary-foreground hover:bg-primary/70",
        secondary:
          "glass-morphism bg-secondary/80 text-secondary-foreground hover:bg-secondary/70",
        destructive:
          "glass-morphism bg-destructive/80 text-destructive-foreground hover:bg-destructive/70",
        outline: "glass-morphism border-2 border-border/50 text-foreground hover:bg-accent/50",
        success: "glass-morphism bg-green-500/80 text-white hover:bg-green-500/70",
        warning: "glass-morphism bg-yellow-500/80 text-white hover:bg-yellow-500/70",
        info: "glass-morphism bg-blue-500/80 text-white hover:bg-blue-500/70",
        gradient: "relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient text-primary-foreground",
      },
      animated: {
        true: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, animated, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, animated }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
