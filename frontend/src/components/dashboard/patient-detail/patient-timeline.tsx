"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { Clock, Smile, AlertTriangle, Moon, Activity } from "lucide-react"

interface DailyLog {
    id: string
    date: string
    mood_rating: number | null
    mood_level: number | null
    sleep_hours: number | null
    risk_flag: boolean
    suicidal_ideation_flag: boolean
    exercise_minutes: number | null
    notes: string | null
}

interface Alert {
    id: string
    severity: string
    trigger_source: string
    status: string
    created_at: string
}

interface Props {
    dailyLogs: DailyLog[]
    alerts: Alert[]
}

const moodEmoji: Record<number, string> = {
    1: "😢", 2: "☹️", 3: "😐", 4: "🙂", 5: "😄"
}

const moodLevelLabel: Record<number, { label: string; color: string }> = {
    [-3]: { label: "Depressão Grave", color: "bg-red-100 text-red-700" },
    [-2]: { label: "Depressão Mod.", color: "bg-orange-100 text-orange-700" },
    [-1]: { label: "Depressão Leve", color: "bg-yellow-100 text-yellow-700" },
    0: { label: "Eutimia", color: "bg-green-100 text-green-700" },
    1: { label: "Hipomania", color: "bg-blue-100 text-blue-700" },
    2: { label: "Mania Mod.", color: "bg-purple-100 text-purple-700" },
    3: { label: "Mania Grave", color: "bg-fuchsia-100 text-fuchsia-700" },
}

export function PatientTimeline({ dailyLogs, alerts }: Props) {
    const t = useTranslations("PatientDetail")

    // Merge daily logs and alerts into a unified timeline
    const timelineItems = [
        ...dailyLogs.map(log => ({
            type: "daily_log" as const,
            date: new Date(log.date),
            data: log,
        })),
        ...alerts.map(alert => ({
            type: "alert" as const,
            date: new Date(alert.created_at),
            data: alert,
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15)

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-primary" />
                    {t("recentActivity")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {timelineItems.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        {t("noActivity")}
                    </div>
                ) : (
                    <div className="relative space-y-0">
                        {timelineItems.map((item, idx) => (
                            <div key={`${item.type}-${item.type === 'daily_log' ? item.data.id : item.data.id}`} className="flex gap-3 relative pb-6">
                                {/* Line */}
                                {idx < timelineItems.length - 1 && (
                                    <div className="absolute left-[15px] top-[28px] bottom-[-8px] w-0.5 bg-border" />
                                )}

                                {/* Icon */}
                                <div className="flex-shrink-0 relative z-10">
                                    {item.type === "alert" ? (
                                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                                            {(item.data as DailyLog).risk_flag ? (
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <Smile className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">
                                            {item.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                        {item.type === "alert" && (
                                            <Badge variant={(item.data as Alert).severity === "HIGH" ? "destructive" : "default"} className="text-[10px]">
                                                {(item.data as Alert).severity}
                                            </Badge>
                                        )}
                                    </div>

                                    {item.type === "daily_log" ? (
                                        <DailyLogEntry log={item.data as DailyLog} />
                                    ) : (
                                        <AlertEntry alert={item.data as Alert} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function DailyLogEntry({ log }: { log: DailyLog }) {
    return (
        <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
                {log.mood_rating && (
                    <span className="text-lg">{moodEmoji[log.mood_rating]}</span>
                )}
                {log.mood_level !== null && (
                    <Badge variant="outline" className={`text-[10px] ${moodLevelLabel[log.mood_level]?.color || ""}`}>
                        {moodLevelLabel[log.mood_level]?.label || `Nível ${log.mood_level}`}
                    </Badge>
                )}
                {log.risk_flag && (
                    <Badge variant="destructive" className="text-[10px]">⚠ Risco</Badge>
                )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {log.sleep_hours && (
                    <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3" /> {log.sleep_hours}h
                    </span>
                )}
                {log.exercise_minutes && (
                    <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" /> {log.exercise_minutes}min
                    </span>
                )}
            </div>
            {log.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2 italic">"{log.notes}"</p>
            )}
        </div>
    )
}

function AlertEntry({ alert }: { alert: Alert }) {
    return (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {alert.trigger_source.replace(/_/g, " ")}
            </p>
            <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{alert.status}</Badge>
            </div>
        </div>
    )
}
