"use client"

import { Home, Calendar, Plus, TrendingUp, User } from "lucide-react"
import { usePathname } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Início", path: "/app" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: TrendingUp, label: "Evolução", path: "/evolucao" },
  { icon: User, label: "Perfil", path: "/settings" },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    return pathname?.includes(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 z-50 safe-area-bottom">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 w-16 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
