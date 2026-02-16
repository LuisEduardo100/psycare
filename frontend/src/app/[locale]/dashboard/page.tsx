"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"
import { useEffect, useState } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { SentinelAlertsList } from "@/components/dashboard/sentinel-alerts-list"
import { PatientList } from "@/components/dashboard/patient-list"
import { Header } from "@/components/dashboard/header"
import { NewPatientModal } from "@/components/dashboard/new-patient-modal"
import { InvitePatientModal } from "@/components/dashboard/invite-patient-modal"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        if (!isHydrated) return

        if (!isAuthenticated) {
            router.push("/login")
        }
        if (user && user.role === 'PATIENT') {
            router.push("/app")
        }
    }, [isAuthenticated, user, router, isHydrated])

    if (!isAuthenticated || !user) {
        return null
    }

    return (
        <div className="space-y-6 lg:space-y-10">
            <Header />

            {/* Top Metrics Bar */}
            <StatsCards />

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
                {/* Sentinel Alerts Section */}
                <div className="xl:col-span-1">
                    <SentinelAlertsList />
                </div>

                {/* My Patients Section */}
                <div className="xl:col-span-2">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-0 lg:rounded-t-3xl lg:border-t lg:border-x lg:border-primary/10 lg:bg-white lg:p-8 lg:pb-4 lg:dark:bg-[#152a28]">
                        <h3 className="text-lg font-bold text-[#0d1b1a] dark:text-white lg:text-xl">
                            Meus Pacientes
                        </h3>

                        <div className="flex gap-3 w-full lg:w-auto">
                            <div className="flex-1 lg:flex-none">
                                <InvitePatientModal />
                            </div>
                            <div className="flex-1 lg:flex-none">
                                <NewPatientModal />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:rounded-b-3xl lg:rounded-t-none lg:border-t-0">
                        {/* PatientList needs to be responsive internally or we wrap it */}
                        <PatientList />

                        <button onClick={() => router.push('/dashboard/patients')} className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-primary transition-colors lg:hidden">
                            Ver Diretório Completo
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Action Bar removed as requested, actions are now in the list header */}
        </div>
    )
}
