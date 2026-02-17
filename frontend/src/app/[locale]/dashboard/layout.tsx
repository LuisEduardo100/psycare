"use client"

import { AppSidebar } from "@/components/shared/app-sidebar"
import { BottomNav } from "@/components/dashboard/bottom-nav"

import { useAuthStore } from "@/store/useAuthStore"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isAuthenticated, fetchUser } = useAuthStore()
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        if (!user && isAuthenticated) {
            fetchUser()
        }
    }, [user, isAuthenticated, fetchUser])

    // Prevent hydration mismatch or flash of wrong content
    if (!isClient) {
        return null
    }

    // Default to DOCTOR if role is missing, or handle PATIENT
    const userRole = user?.role === 'PATIENT' ? 'PATIENT' : 'DOCTOR'

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            <AppSidebar role={userRole} className="hidden lg:flex fixed left-0 top-0 h-full z-30" />

            <main className="flex-1 pb-24 lg:ml-64 lg:p-10 lg:pb-10 w-full overflow-x-hidden">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}
