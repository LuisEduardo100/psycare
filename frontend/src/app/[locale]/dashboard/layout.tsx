"use client"

import { AppSidebar } from "@/components/shared/app-sidebar"
import { BottomNav } from "@/components/dashboard/bottom-nav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            <AppSidebar role="DOCTOR" className="hidden lg:flex fixed left-0 top-0 h-full z-30" />

            <main className="flex-1 pb-24 lg:ml-64 lg:p-10 lg:pb-10 w-full overflow-x-hidden">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}
