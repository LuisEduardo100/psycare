"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, TrendingDown, Moon, ChevronRight } from "lucide-react"
import { Link } from "@/i18n/routing"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface Alert {
    id: string
    patient: {
        full_name: string
        id: string
    }
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    trigger_source: string
    status: 'PENDING' | 'VIEWED' | 'CONTACTED' | 'RESOLVED'
    created_at: string
}

export function SentinelAlertsList() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                // Fetch mostly urgent/medium alerts
                const response = await api.get('/alerts?status=PENDING&limit=3')
                setAlerts(response.data)
            } catch (error) {
                console.error("Failed to fetch alerts", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAlerts()
    }, [])

    const getAlertIcon = (trigger: string) => {
        if (trigger.toLowerCase().includes('sleep')) return Moon
        if (trigger.toLowerCase().includes('mood')) return TrendingDown
        return AlertTriangle
    }

    const getBorderColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'border-red-500'
            case 'MEDIUM': return 'border-amber-500'
            default: return 'border-blue-500'
        }
    }

    const getTextColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'text-red-600 dark:text-red-400'
            case 'MEDIUM': return 'text-amber-600 dark:text-amber-400'
            default: return 'text-blue-600 dark:text-blue-400'
        }
    }

    const getRingColor = (severity: string) => {
        switch (severity) {
            case 'HIGH': return 'ring-red-50/50'
            case 'MEDIUM': return 'ring-amber-50/50'
            default: return 'ring-blue-50/50'
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <section>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-[#0d1b1a] dark:text-white">
                    Alertas Sentinela
                    {alerts.length > 0 && (
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                    )}
                </h2>
                <Link href="/dashboard/alerts" className="text-primary text-sm font-semibold hover:underline">
                    Ver Todos
                </Link>
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center text-slate-500">
                        Nenhum alerta pendente.
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const Icon = getAlertIcon(alert.trigger_source)
                        return (
                            <Link
                                key={alert.id}
                                href={`/dashboard/patients/${alert.patient.id}`}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border-l-4 group transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50",
                                    getBorderColor(alert.severity)
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center ring-2",
                                        getRingColor(alert.severity)
                                    )}>
                                        <span className="font-bold text-slate-500">
                                            {alert.patient.full_name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">
                                            {alert.patient.full_name}
                                        </h3>
                                        <p className={cn("text-sm font-medium flex items-center gap-1", getTextColor(alert.severity))}>
                                            <Icon className="h-4 w-4" />
                                            {alert.trigger_source}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                            </Link>
                        )
                    })
                )}
            </div>
        </section>
    )
}
