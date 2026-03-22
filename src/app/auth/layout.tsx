export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-svh flex items-start justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8 sm:items-center sm:py-10">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    )
}
