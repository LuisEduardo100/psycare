"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { SentinelStats } from "@/components/dashboard/sentinel-stats"
import { SentinelFilters } from "@/components/dashboard/sentinel-filters"
import { SentinelAlertCard } from "@/components/dashboard/sentinel-alert-card"
import { AlertActionModal } from "@/components/dashboard/alerts/alert-action-modal"
import { useSSE } from "@/hooks/useSSE"
import { useTranslations } from "next-intl"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Alert {
    id: string
    patient: {
        id: string
        user: {
            full_name: string
        }
        avatar_url?: string
    }
    severity: "LOW" | "MEDIUM" | "HIGH"
    trigger_source: string
    status: "PENDING" | "VIEWED" | "CONTACTED" | "RESOLVED" | "FALSE_POSITIVE"
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
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    // Helper to check if alert is overdue (>24h)
    const isOverdue = (createdAt: string) => {
        const created = new Date(createdAt).getTime()
        const now = new Date().getTime()
        const hoursDiff = (now - created) / (1000 * 60 * 60)
        return hoursDiff > 24
    }

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

    // SSE Integration for real-time updates
    useSSE({
        onNewAlert: (data) => {
            console.log('[SSE] New alert received:', data)
            toast.info('Novo alerta recebido', {
                description: `${data.alert?.patient?.user?.full_name || 'Paciente'} - ${data.alert?.trigger_source || 'Alerta'}`,
            })
            fetchAlerts() // Refresh alert list
        },
        onAlertUpdated: (data) => {
            console.log('[SSE] Alert updated:', data)
            fetchAlerts() // Refresh alert list
        },
    })

    useEffect(() => {
        if (!isHydrated) return

        if (!isAuthenticated) {
            router.push("/login")
            return
        }
        fetchAlerts()
    }, [isAuthenticated, router, isHydrated])

    const filteredAlerts = useMemo(() => {
        return alerts.filter((alert) => {
            const matchesFilter = filter === "ALL" || alert.severity === filter
            const patientName = alert.patient?.user?.full_name || ""
            const matchesSearch = !search ||
                patientName.toLowerCase().includes(search.toLowerCase())
            return matchesFilter && matchesSearch
        })
    }, [alerts, filter, search])

    const stats = useMemo(() => {
        const active = alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "FALSE_POSITIVE")
        const critical = active.filter((a) => a.severity === "HIGH")
        const resolved = alerts.filter((a) => a.status === "RESOLVED")
        const overdue = active.filter((a) => isOverdue(a.created_at))
        return {
            totalActive: active.length,
            critical: critical.length,
            overdue: overdue.length,
            avgResponseTime: "2.4h",
            resolutionRate: alerts.length > 0
                ? `${Math.round((resolved.length / alerts.length) * 100)}%`
                : "0%",
        }
    }, [alerts])

    const handleOpenActionModal = (alert: Alert) => {
        setSelectedAlert(alert)
        setModalOpen(true)
    }

    const handleModalSuccess = () => {
        fetchAlerts()
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
                        <div key={alert.id} className="relative">
                            {/* SLA Warning Badge */}
                            {alert.status === 'PENDING' && isOverdue(alert.created_at) && (
                                <div className="absolute -top-2 -right-2 z-10">
                                    <div className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                        <Clock className="h-3 w-3" />
                                        SLA: +24h
                                    </div>
                                </div>
                            )}
                            <SentinelAlertCard
                                alert={alert}
                                onViewProfile={(id) => router.push(`/dashboard/patients/${alert.patient.id}`)}
                                onContact={(id) => handleOpenActionModal(alert)}
                                onQuickNote={(id) => console.log("Quick note", id)}
                                onStatusChange={(id, status) => handleOpenActionModal(alert)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Action Modal */}
            <AlertActionModal
                alert={selectedAlert}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        </div>
    )
}
