"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/routing" // Use next-intl router
import { useAuthStore } from "@/store/useAuthStore"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'PATIENT') {
        router.push("/app")
      } else {
        router.push("/dashboard")
      }
    } else if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}
