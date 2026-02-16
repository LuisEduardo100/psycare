"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    User, MoreHorizontal, Phone, StickyNote, TrendingUp, TrendingDown, Minus, Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AlertData {
    id: string
    patient: { full_name: string; avatar_url?: string }
    severity: "LOW" | "MEDIUM" | "HIGH"
    trigger_source: string
    status: "PENDING" | "VIEWED" | "CONTACTED" | "RESOLVED"
    created_at: string
    trends?: {
        mood: "up" | "down" | "stable"
        sleep: "up" | "down" | "stable"
        adherence: "up" | "down" | "stable"
    }
}

interface SentinelAlertCardProps {
    alert: AlertData
    onViewProfile: (alertId: string) => void
    onContact: (alertId: string) => void
    onQuickNote: (alertId: string) => void
    onStatusChange: (alertId: string, status: string) => void
}

const severityConfig = {
    HIGH: { color: "border-l-red-500", badge: "bg-red-100 text-red-800 border-red-200", label: "Crítico" },
    MEDIUM: { color: "border-l-amber-500", badge: "bg-amber-100 text-amber-800 border-amber-200", label: "Médio" },
    LOW: { color: "border-l-yellow-400", badge: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Baixo" },
}

const statusConfig = {
    PENDING: { badge: "bg-red-50 text-red-700 border-red-200", label: "Pendente" },
    VIEWED: { badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Visualizado" },
    CONTACTED: { badge: "bg-teal-50 text-teal-700 border-teal-200", label: "Contatado" },
    RESOLVED: { badge: "bg-green-50 text-green-700 border-green-200", label: "Resolvido" },
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
    if (trend === "up") return <TrendingUp className="h-3 w-3 text-green-500" />
    if (trend === "down") return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
}

export function SentinelAlertCard({
    alert,
    onViewProfile,
    onContact,
    onQuickNote,
    onStatusChange,
}: SentinelAlertCardProps) {
    const severity = severityConfig[alert.severity]
    const status = statusConfig[alert.status]
    const initials = alert.patient.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()

    let timeAgo = ""
    try {
        timeAgo = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })
    } catch {
        timeAgo = alert.created_at
    }

    return (
        <div className={`bg-card rounded-xl border border-border shadow-sm border-l-4 ${severity.color} overflow-hidden`}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] font-bold ${severity.badge}`}>
                            {severity.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${status.badge}`}>
                        {status.label}
                    </Badge>
                </div>

                {/* Patient Info */}
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm truncate">
                            {alert.patient.full_name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                            {alert.trigger_source}
                        </p>
                    </div>
                </div>

                {/* Trends */}
                {alert.trends && (
                    <div className="flex items-center gap-4 mb-3 py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">Humor</span>
                            <TrendIcon trend={alert.trends.mood} />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">Sono</span>
                            <TrendIcon trend={alert.trends.sleep} />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-medium">Adesão</span>
                            <TrendIcon trend={alert.trends.adherence} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => onViewProfile(alert.id)}
                    >
                        <User className="h-3 w-3 mr-1" />
                        Ver Perfil
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => onContact(alert.id)}
                    >
                        <Phone className="h-3 w-3 mr-1" />
                        Contatar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => onQuickNote(alert.id)}
                    >
                        <StickyNote className="h-3 w-3 mr-1" />
                        Nota
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onStatusChange(alert.id, "VIEWED")}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> Marcar como Visto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(alert.id, "CONTACTED")}>
                                <Phone className="h-3.5 w-3.5 mr-2" /> Marcar Contatado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(alert.id, "RESOLVED")}>
                                <TrendingUp className="h-3.5 w-3.5 mr-2" /> Resolver
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
