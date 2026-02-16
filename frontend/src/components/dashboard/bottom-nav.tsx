"use client"

import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Settings
} from "lucide-react"

export function BottomNav() {
    const pathname = usePathname()

    const navigation = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Pacientes", href: "/dashboard/patients", icon: Users },
        { name: "Agenda", href: "/dashboard/appointments", icon: Calendar },
        { name: "Insights", href: "/dashboard/reports", icon: FileText },
        { name: "Ajustes", href: "/dashboard/settings", icon: Settings },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 px-4 pb-6 pt-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-colors",
                                isActive ? "text-primary" : "text-slate-400"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
