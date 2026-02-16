"use client"

import { Home, Calendar, TrendingUp, User, Activity } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
// import { useAuthStore } from "@/store/useAuthStore" // Assuming auth store exists for user info

const navItems = [
    { icon: Home, label: "Início", path: "/app" },
    { icon: Calendar, label: "Agenda", path: "/agenda" },
    { icon: TrendingUp, label: "Evolução", path: "/evolucao" },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    // const { user } = useAuthStore() // Use if available, else static for now or fetch

    // Mock user for display matching mockup or existing data
    const user = {
        name: "João Silva",
        id: "#4829",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-tQG-s6cKjh1OOCOSU7pwfHayFINPhAIZtctUT1UMbKSfuYtGaq8x_Mkw9dmCYdBgIKDWjvM1e6h5Z9m0STo_3jxatJKjy6MIEOPxY5JrLrN5ZB9-mG0jSEoLGHJo-lgAEWfak6D3J5w5tejQKa04zVMQQPgYuYiygNWAaE3V4zvoCMY0rPoeRqF18xga_t7NmpaNYDlA5NOAx2jb-9YWYblw_on2lD3Co4DnzaFCN-vJUrWWc2KF810DEBjYrrBwhsMBGMsdt9SO"
    }

    const isActive = (path: string) => {
        return pathname?.includes(path)
    }

    return (
        <aside className="w-64 bg-background border-r border-border hidden md:flex flex-col h-screen sticky top-0 left-0 shrink-0">
            <div className="p-6 flex flex-col gap-8 h-full">
                {/* Logo/Brand */}
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-foreground text-base font-bold leading-tight">PsyCare</h1>
                        <p className="text-primary text-xs font-medium">Portal do Paciente</p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => router.push(item.path)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                                    active
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted font-medium"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", active ? "text-primary" : "group-hover:text-primary transition-colors")} />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* User Profile Mini */}
                <div className="mt-auto pt-6 border-t border-border">
                    <button
                        onClick={() => router.push("/settings")}
                        className="flex items-center gap-3 w-full hover:bg-muted/50 p-2 rounded-lg transition-colors text-left"
                    >
                        {/* Using a placeholder avatar or next/image would be better, but basic img for now to match structure */}
                        <div className="size-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            <img alt="Profile" className="size-full object-cover" src={user.image} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <p className="text-sm font-bold truncate text-foreground">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paciente {user.id}</p>
                        </div>
                    </button>
                </div>
            </div>
        </aside>
    )
}
