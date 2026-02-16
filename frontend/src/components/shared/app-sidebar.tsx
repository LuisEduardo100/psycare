"use client"

import {
    Calendar,
    Home,
    User,
    LogOut,
    Users,
    Settings,
    Menu,
    FileText,
    Activity,
    UserPlus
} from "lucide-react"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"
import { Link, usePathname } from "@/i18n/routing"
import { cn } from "@/lib/utils"
// UI Components would be imported here from shadcn/ui if available, 
// but using standard divs/buttons for now to ensure compatibility
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/user-avatar"

interface AppSidebarProps {
    role: "PATIENT" | "DOCTOR"
    className?: string
}

export function AppSidebar({ role, className }: AppSidebarProps) {
    const { user, logout, fetchUser, avatarVersion } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    // Fetch user details on mount to ensure we have the latest profile picture
    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    // Sidebar Items Configuration
    const patientItems = [
        { title: "Início", icon: Home, url: "/app" },
        { title: "Agenda", icon: Calendar, url: "/minhas-consultas" },
        { title: "Evolução", icon: Activity, url: "/timeline" },
    ]

    const doctorItems = [
        { title: "Dashboard", icon: Home, url: "/dashboard" },
        { title: "Pacientes", icon: Users, url: "/dashboard/patients" },
        { title: "Agenda", icon: Calendar, url: "/dashboard/agenda" },
    ]

    const items = role === "DOCTOR" ? doctorItems : patientItems
    const settingsUrl = role === "DOCTOR" ? "/dashboard/settings" : "/settings"

    return (
        <div className={cn("flex flex-col h-screen w-64 bg-card border-r border-border", className)}>
            {/* Header / Logo */}
            <div className="p-6 border-b border-border/50">
                <Link href={role === "DOCTOR" ? "/dashboard" : "/app"} className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <Activity className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl text-primary">PsyCare</span>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {items.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                        return (
                            <Link
                                key={item.url}
                                href={item.url}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-border/50 space-y-2">
                <Link href={settingsUrl} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                    <UserAvatar
                        userId={user?.userId}
                        fallbackName={user?.fullName}
                        className="h-9 w-9 border border-border group-hover:border-primary/50 transition-colors"
                    />
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">
                            {role === "DOCTOR" ? "Médico" : "Paciente"}
                        </p>
                    </div>
                </Link>

                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </div>
        </div>
    )
}
