import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background relative">
            <div className="h-48 bg-gradient-to-br from-teal-600 to-teal-500 rounded-b-[2rem]" />
            <div className="relative -mt-24 mx-auto max-w-md px-4 pb-8">
                <div className="absolute -top-20 right-4">
                    <LanguageSwitcher />
                </div>
                {children}
            </div>
        </div>
    )
}
