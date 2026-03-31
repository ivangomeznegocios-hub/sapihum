import Link from 'next/link'
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
                    <Link href="/" className="inline-flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-xs font-bold tracking-[0.18em] text-[#f6ae02] shadow-lg">
                            SH
                        </div>
                        <div className="text-left">
                            <p className="text-lg font-bold uppercase tracking-[0.18em] text-foreground">{brandName}</p>
                            <p className="text-sm text-muted-foreground">{brandAuthSubtitle}</p>
                        </div>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    )
}
