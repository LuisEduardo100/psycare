"use client"

import { Bell, Plus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/useAuthStore"
import { InvitePatientDialog } from "@/components/dashboard/invite-patient-dialog"
import { useRouter } from "@/i18n/routing"

export function Header() {
    const { user } = useAuthStore()
    const router = useRouter()

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between bg-background-light/80 px-4 py-4 backdrop-blur-md dark:bg-background-dark/80 lg:mb-10 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <div className="flex items-center gap-3">
                <div className="relative lg:hidden">
                    <div className="h-12 w-12 rounded-full border-2 border-primary/20 p-0.5">
                        <img
                            alt="Doctor Profile"
                            className="h-full w-full rounded-full object-cover"
                            src="https://github.com/shadcn.png"
                        />
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-background-dark"></div>
                </div>
                <div>
                    <h2 className="hidden text-3xl font-extrabold text-[#0d1b1a] dark:text-white lg:block">
                        Bem-vindo, {user?.fullName || "Doutor"}
                    </h2>
                    <p className="hidden text-[#4c9a93] lg:block">
                        Aqui está o resumo dos seus pacientes hoje.
                    </p>
                    <div className="lg:hidden">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bom dia,</p>
                        <h1 className="text-lg font-bold leading-tight">{user?.fullName || "Doutor"}</h1>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button className="relative rounded-xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:hidden">
                    <Bell className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500 dark:border-slate-800"></span>
                </button>
            </div>
        </header >
    )
}
