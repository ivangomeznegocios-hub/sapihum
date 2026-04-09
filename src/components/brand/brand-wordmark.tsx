import type { ComponentProps } from 'react'
import { brandName } from '@/lib/brand'
import { cn } from '@/lib/utils'

type BrandWordmarkProps = ComponentProps<'span'>

export function BrandWordmark({ className, ...props }: BrandWordmarkProps) {
    return (
        <span
            className={cn(
                'inline-block whitespace-nowrap font-black uppercase leading-none tracking-[0.12em]',
                className
            )}
            {...props}
        >
            {brandName}
        </span>
    )
}
