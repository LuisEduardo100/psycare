"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"

export default function RouteGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated, user } = useAuthStore()
    const [checkingProfile, setCheckingProfile] = useState(true)

    useEffect(() => {
        const checkProfile = async () => {
            if (isAuthenticated && user?.role === 'PATIENT') {
                try {
                    const response = await api.get('/users/me')
                    const hasProfile = response.data.hasProfile; // Access correct property

                    if (!hasProfile && pathname !== '/onboarding') {
                        router.push('/onboarding')
                    } else if (hasProfile && pathname === '/onboarding') {
                        router.push('/app')
                    }
                } catch (error) {
                    console.error("Failed to check profile", error)
                }
            }
            setCheckingProfile(false)
        }

        if (isAuthenticated) {
            checkProfile()
        } else {
            setCheckingProfile(false)
        }
    }, [isAuthenticated, user, pathname, router])

    if (checkingProfile && isAuthenticated && user?.role === 'PATIENT') {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    return <>{children}</>
}
