"use client"

import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings,
    LogOut,
    Stethoscope
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"

export function Sidebar() {
    const pathname = usePathname()
    const { logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    const navigation = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Meus Pacientes", href: "/dashboard/patients", icon: Users },
        { name: "Consultas", href: "/dashboard/appointments", icon: Calendar },
        { name: "Relatórios", href: "/dashboard/reports", icon: FileText },
        { name: "Configurações", href: "/dashboard/settings", icon: Settings },
    ]

    return (
        <aside className="hidden h-screen w-72 flex-col border-r bg-white dark:bg-[#152a28] dark:border-primary/10 lg:flex fixed left-0 top-0 z-50">
            <div className="p-8">
                <div className="mb-10 flex items-center gap-3 text-primary">
                    <Stethoscope className="h-10 w-10" />
                    <h1 className="text-xl font-extrabold tracking-tight">Psycare</h1>
                </div>

                <div className="mb-8 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                    <div className="h-12 w-12 rounded-full border-2 border-primary/20 bg-cover bg-center"
                        style={{ backgroundImage: "url('https://github.com/shadcn.png')" }} />
                    <div>
                        <h2 className="text-sm font-bold">Dr. Admin</h2>
                        <p className="text-xs font-medium text-primary">Psiquiatra Chefe</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-[#4c9a93] hover:bg-primary/5"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-auto p-8">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e73108]/10 py-3 px-4 text-sm font-bold text-[#e73108] transition-all hover:bg-[#e73108]/20"
                >
                    <LogOut className="h-5 w-5" />
                    Sair
                </button>
            </div>
        </aside>
    )
}
