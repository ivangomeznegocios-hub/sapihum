import { Suspense } from 'react'
import { ThankYouContent } from './thank-you-content'

function ThankYouFallback() {
    return (
        <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden bg-background">
            <div className="z-10 w-full max-w-xl px-4 py-16 text-center">
                <div className="mx-auto mb-8 h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30" />
                <div className="mx-auto mb-4 h-12 max-w-md rounded bg-muted" />
                <div className="mx-auto h-6 max-w-lg rounded bg-muted/70" />
            </div>
        </div>
    )
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={<ThankYouFallback />}>
            <ThankYouContent />
        </Suspense>
    )
}
