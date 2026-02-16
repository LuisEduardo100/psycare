"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { SentinelStats } from "@/components/dashboard/sentinel-stats"
import { SentinelFilters } from "@/components/dashboard/sentinel-filters"
import { SentinelAlertCard } from "@/components/dashboard/sentinel-alert-card"
import { useTranslations } from "next-intl"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Alert {
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

export default function AlertsPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const t = useTranslations("Alerts")
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("ALL")
    const [search, setSearch] = useState("")
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    const fetchAlerts = async () => {
        try {
            const response = await api.get("/alerts")
            setAlerts(response.data)
        } catch (error) {
            console.error("Failed to fetch alerts", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isHydrated) return

        if (!isAuthenticated) {
            router.push("/login")
            return
        }
        fetchAlerts()
        const interval = setInterval(fetchAlerts, 30000)
        return () => clearInterval(interval)
    }, [isAuthenticated, router, isHydrated])

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const matchesFilter = filter === "ALL" || alert.severity === filter
            const matchesSearch = !search ||
                alert.patient.full_name.toLowerCase().includes(search.toLowerCase())
            return matchesFilter && matchesSearch
        })
    }, [alerts, filter, search])

    const stats = useMemo(() => {
        const active = alerts.filter((a) => a.status !== "RESOLVED")
        const critical = active.filter((a) => a.severity === "HIGH")
        const resolved = alerts.filter((a) => a.status === "RESOLVED")
        return {
            totalActive: active.length,
            critical: critical.length,
            avgResponseTime: "2.4h",
            resolutionRate: alerts.length > 0
                ? `${Math.round((resolved.length / alerts.length) * 100)}%`
                : "0%",
        }
    }, [alerts])

    const handleStatusChange = async (alertId: string, status: string) => {
        try {
            await api.patch(`/alerts/${alertId}/status`, { status })
            fetchAlerts()
        } catch (error) {
            console.error("Failed to update alert", error)
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        {t("title") || "Alertas Sentinela"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitoramento de riscos e alertas prioritários
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                >
                    Voltar ao Dashboard
                </Button>
            </div>

            {/* Stats */}
            <SentinelStats {...stats} />

            {/* Filters */}
            <SentinelFilters
                activeFilter={filter}
                onFilterChange={setFilter}
                searchQuery={search}
                onSearchChange={setSearch}
            />

            {/* Alert List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-4 border border-border shadow-sm animate-pulse h-40" />
                    ))}
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">Tudo em ordem</h3>
                    <p className="text-sm text-muted-foreground">
                        Nenhum alerta encontrado para os filtros selecionados.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAlerts.map((alert) => (
                        <SentinelAlertCard
                            key={alert.id}
                            alert={alert}
                            onViewProfile={(id) => console.log("View profile", id)}
                            onContact={(id) => console.log("Contact", id)}
                            onQuickNote={(id) => console.log("Quick note", id)}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
