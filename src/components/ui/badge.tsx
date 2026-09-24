import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors border select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-none",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        neutral:
          "border-border bg-muted/60 text-muted-foreground",
        indigo:
          "border-primary/25 bg-primary/10 text-primary font-medium",
        accent:
          "border-primary/30 bg-primary/15 text-primary font-medium shadow-xs shadow-primary/20",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive font-medium",
        outline:
          "border-border text-foreground bg-transparent",
      },
      size: {
        default: "text-xs px-2 py-0.5",
        sm: "text-[11px] px-1.5 py-0.25 leading-normal",
        lg: "text-sm px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
