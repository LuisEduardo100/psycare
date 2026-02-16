"use client"

import { AppSidebar } from "@/components/shared/app-sidebar"
import { BottomNav } from "@/components/patient/bottom-nav"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isOnboarding = pathname?.includes("/onboarding")

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar - Hidden on mobile */}
            {!isOnboarding && <AppSidebar role="PATIENT" className="hidden md:flex fixed left-0 top-0 h-full z-30" />}

            {/* Main Content Area */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen",
                !isOnboarding && "md:ml-64" // Add margin only when sidebar is visible
            )}>
                <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-2 md:p-8 pb-24 md:pb-8 safe-area-top overflow-y-auto">
                    {children}
                </main>

                {/* Mobile Bottom Nav - Hidden on desktop */}
                {!isOnboarding && (
                    <div className="md:hidden">
                        <BottomNav />
                    </div>
                )}
            </div>
        </div>
    )
}
