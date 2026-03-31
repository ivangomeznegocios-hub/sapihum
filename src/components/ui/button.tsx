import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary text-primary-foreground shadow-[0_16px_36px_rgba(246,174,2,0.18)] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-[#e7a103] hover:text-primary-foreground hover:shadow-[0_20px_44px_rgba(246,174,2,0.24)]",
        destructive:
          "border border-destructive/20 bg-destructive text-destructive-foreground shadow-[0_16px_36px_rgba(239,68,68,0.16)] hover:-translate-y-0.5 hover:bg-destructive/90",
        outline:
          "border border-white/18 bg-white/[0.03] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-primary/35 hover:bg-white/[0.06] hover:text-foreground",
        secondary:
          "border border-border/80 bg-secondary text-secondary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.16)] hover:bg-secondary/80",
        ghost: "text-foreground/80 hover:bg-white/[0.04] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
