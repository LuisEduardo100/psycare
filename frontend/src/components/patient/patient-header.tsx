"use client"

import { Bell, ChevronLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"

interface PatientHeaderProps {
  showBack?: boolean
  title?: string
  onBack?: () => void
}

export function PatientHeader({ showBack, title, onBack }: PatientHeaderProps) {
  const { user } = useAuthStore()
  const router = useRouter()

  const firstName = user?.fullName?.split(" ")[0] || "Paciente"
  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P"

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  if (showBack && title) {
    return (
      <header className="flex items-center justify-between py-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <div className="w-9" />
      </header>
    )
  }

  return (
    <header className="flex justify-between items-center py-4">
      <div>
        <p className="text-muted-foreground text-sm font-medium">Bom dia,</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {firstName}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background" />
        </button>
        <Avatar className="h-10 w-10 border-2 border-border">
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
