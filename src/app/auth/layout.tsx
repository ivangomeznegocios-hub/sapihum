import Link from 'next/link'
import { BrandWordmark } from '@/components/brand/brand-wordmark'
import { brandAuthSubtitle, brandName } from '@/lib/brand'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-svh flex items-start justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8 sm:items-center sm:py-10">
            <div className="w-full max-w-md">
                <div className="mb-6 text-center sm:mb-8">
                    <Link href="/" className="inline-flex flex-col items-start gap-2" aria-label={brandName}>
                        <BrandWordmark className="text-base text-[#f6ae02] sm:text-lg sm:tracking-[0.18em]" />
                        <p className="text-left text-sm text-muted-foreground">{brandAuthSubtitle}</p>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    )
}
