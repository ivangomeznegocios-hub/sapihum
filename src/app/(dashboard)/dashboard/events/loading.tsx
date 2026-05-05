function SkeletonBlock({ className }: { className: string }) {
    return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

export default function EventsLoading() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <SkeletonBlock className="h-9 w-64 max-w-full" />
                    <SkeletonBlock className="h-5 w-80 max-w-full" />
                </div>
                <SkeletonBlock className="h-10 w-36" />
            </div>

            <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((item) => (
                    <SkeletonBlock key={item} className="h-10 w-32" />
                ))}
            </div>

            <section className="space-y-6">
                <SkeletonBlock className="h-8 w-72 max-w-full" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
                        <div key={item} className="overflow-hidden rounded-lg border bg-card">
                            <SkeletonBlock className="aspect-[16/9] w-full rounded-none" />
                            <div className="space-y-4 p-5">
                                <SkeletonBlock className="h-6 w-4/5" />
                                <SkeletonBlock className="h-4 w-3/5" />
                                <SkeletonBlock className="h-4 w-full" />
                                <SkeletonBlock className="h-10 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
