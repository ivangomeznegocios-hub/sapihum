function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function NewEventLoading() {
    return (
        <div className="space-y-8">
            <SkeletonBlock className="h-5 w-36" />

            <div className="space-y-3">
                <SkeletonBlock className="h-9 w-64 max-w-full" />
                <SkeletonBlock className="h-5 w-80 max-w-full" />
            </div>

            <div className="max-w-5xl rounded-lg border bg-card p-6">
                <SkeletonBlock className="mb-6 h-7 w-48" />
                <div className="grid gap-5 md:grid-cols-2">
                    {[0, 1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="space-y-2">
                            <SkeletonBlock className="h-4 w-28" />
                            <SkeletonBlock className="h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
