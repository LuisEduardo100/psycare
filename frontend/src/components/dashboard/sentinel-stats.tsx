"use client"

import { AlertTriangle, Clock, CheckCircle, Activity } from "lucide-react"

interface SentinelStatsProps {
    totalActive: number
    critical: number
    avgResponseTime: string
    resolutionRate: string
}

export function SentinelStats({ totalActive, critical, avgResponseTime, resolutionRate }: SentinelStatsProps) {
    const stats = [
        { label: "Total Ativos", value: totalActive, icon: Activity, color: "text-blue-600 bg-blue-50" },
        { label: "Críticos", value: critical, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
        { label: "Tempo Médio", value: avgResponseTime, icon: Clock, color: "text-amber-600 bg-amber-50" },
        { label: "Taxa Resolução", value: resolutionRate, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-card rounded-xl p-4 border border-border shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                </div>
            ))}
        </div>
    )
}
