"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, user, fetchUser } = useAuthStore()
    const [checkingProfile, setCheckingProfile] = useState(true)

    // 1. Fetch user profile when authenticated
    useEffect(() => {
        const loadProfile = async () => {
            if (isAuthenticated && !user?.hasProfile) {
                try {
                    await fetchUser()
                } catch (error) {
                    // handled by interceptor
                }
            }
            setCheckingProfile(false)
        }

        if (isAuthenticated) {
            loadProfile()
        } else {
            setCheckingProfile(false)
        }
    }, [isAuthenticated]) // Only runs when auth state changes

    // 2. Redirect based on profile status
    useEffect(() => {
        if (!isAuthenticated || checkingProfile || !user) return

        if (user.role === 'PATIENT') {
            const hasProfile = user.hasProfile
            if (!hasProfile && pathname !== '/onboarding') {
                router.push('/onboarding')
            } else if (hasProfile && pathname === '/onboarding') {
                router.push('/app')
            }
        }
    }, [user, pathname, checkingProfile, isAuthenticated, router])

    if (checkingProfile && isAuthenticated && user?.role === 'PATIENT') {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    return <>{children}</>
}
