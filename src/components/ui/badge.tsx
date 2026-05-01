import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2 focus:ring-offset-background",
    {
        variants: {
            variant: {
                default:
                    "border-brand-blue-border bg-brand-blue-soft text-brand-blue-dark hover:bg-brand-blue-border/60",
                secondary:
                    "border-border/80 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-destructive/25 bg-destructive/12 text-destructive-foreground hover:bg-destructive/18",
                outline: "border-border/80 bg-card text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
