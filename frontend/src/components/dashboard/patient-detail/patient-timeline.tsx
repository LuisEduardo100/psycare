"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Clock,
    Moon,
    Activity,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronLeft,
    ChevronRight,
    Pill,
    FileText,
    Filter,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTranslations } from "next-intl"
import { useState, useMemo } from "react"

interface DailyLog {
    id: string
    date: string
    mood_score: number
    sleep_hours: number
    medication_taken: boolean
    notes?: string
    risk_flags?: string[]
}

interface Alert {
    id: string
    severity: "LOW" | "MEDIUM" | "HIGH"
    trigger_source: string
    status: string
    created_at: string
}

interface ClinicalEvolution {
    id: string
    evolution_date: string
    evolution_notes: string
    mood_assessment?: string
    doctor?: { full_name: string }
}

interface Medication {
    id: string
    name: string
    start_date: string
    end_date?: string
}

interface Props {
    dailyLogs: DailyLog[]
    alerts: Alert[]
    clinicalEvolutions?: ClinicalEvolution[]
    medications?: Medication[]
}

function getMoodIcon(score: number) {
    if (score >= 7) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 4) return <Minus className="h-4 w-4 text-amber-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
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

export function PatientTimeline({ dailyLogs, alerts, clinicalEvolutions = [], medications = [] }: Props) {
    const t = useTranslations("PatientDetail")
    const [currentPage, setCurrentPage] = useState(0)
    const [filter, setFilter] = useState<'all' | 'logs' | 'alerts' | 'evolutions' | 'medications'>('all')
    const itemsPerPage = 5

    // Merge all timeline items
    const allTimelineItems = useMemo(() => [
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
        ...clinicalEvolutions.map(evo => ({
            type: "clinical_evolution" as const,
            date: new Date(evo.evolution_date),
            data: evo,
        })),
        ...medications.map(med => ({
            type: "medication" as const,
            date: new Date(med.start_date),
            data: med,
        })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()), [dailyLogs, alerts, clinicalEvolutions, medications])

    // Apply filter
    const timelineItems = useMemo(() => {
        if (filter === 'all') return allTimelineItems
        if (filter === 'logs') return allTimelineItems.filter(i => i.type === 'daily_log')
        if (filter === 'alerts') return allTimelineItems.filter(i => i.type === 'alert')
        if (filter === 'evolutions') return allTimelineItems.filter(i => i.type === 'clinical_evolution')
        if (filter === 'medications') return allTimelineItems.filter(i => i.type === 'medication')
        return allTimelineItems
    }, [allTimelineItems, filter])

    const paginatedItems = timelineItems.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    const totalPages = Math.ceil(timelineItems.length / itemsPerPage)

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(0, prev - 1))
    }

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5 text-primary" />
                    {t("recentActivity")}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <Select value={filter} onValueChange={(val) => setFilter(val as typeof filter)}>
                        <SelectTrigger className="w-[180px] h-8">
                            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="logs">Daily Logs</SelectItem>
                            <SelectItem value="alerts">Alerts</SelectItem>
                            <SelectItem value="evolutions">Clinical Evolutions</SelectItem>
                            <SelectItem value="medications">Medications</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 ml-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {currentPage + 1} / {totalPages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {timelineItems.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        {t("noActivity")}
                    </div>
                ) : (
                    <div className="relative space-y-0">
                        {timelineItems.map((item, idx) => (
                            <div key={`${item.type}-${getItemKey(item)}`} className="flex gap-3 relative pb-6">
                                {/* Line */}
                                {idx < timelineItems.length - 1 && (
                                    <div className="absolute left-[15px] top-[28px] bottom-[-8px] w-0.5 bg-border" />
                                )}

                                {/* Icon */}
                                <div className="flex-shrink-0 relative z-10">
                                    {item.type === "alert" && (
                                        <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                    )}
                                    {item.type === "daily_log" && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                                            {(item.data as DailyLog).risk_flags?.length ? (
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            ) : (
                                                <Activity className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                    )}
                                    {item.type === "clinical_evolution" && (
                                        <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-purple-600" />
                                        </div>
                                    )}
                                    {item.type === "medication" && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                                            <Pill className="h-4 w-4 text-emerald-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-muted-foreground">
                                            {item.type === 'daily_log'
                                                ? (() => {
                                                    const d = new Date(item.date);
                                                    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
                                                })()
                                                : item.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: '2-digit', minute: '2-digit' })
                                            }
                                        </span>
                                        {item.type === "alert" && (
                                            <Badge variant={(item.data as Alert).severity === "HIGH" ? "destructive" : "default"} className="text-[10px]">
                                                {(item.data as Alert).severity}
                                            </Badge>
                                        )}
                                        {item.type === "clinical_evolution" && (
                                            <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-700 bg-purple-50">
                                                Evolução
                                            </Badge>
                                        )}
                                    </div>

                                    {item.type === "daily_log" && <DailyLogEntry log={item.data as DailyLog} />}
                                    {item.type === "alert" && <AlertEntry alert={item.data as Alert} />}
                                    {item.type === "clinical_evolution" && <ClinicalEvolutionEntry evolution={item.data as ClinicalEvolution} />}
                                    {item.type === "medication" && <MedicationEntry medication={item.data as Medication} />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function getItemKey(item: any) {
    if (item.type === 'daily_log') return item.data.id;
    if (item.type === 'alert') return item.data.id;
    if (item.type === 'clinical_evolution') return item.data.id;
    if (item.type === 'medication') return item.data.id;
    return Math.random().toString();
}

function DailyLogEntry({ log }: { log: DailyLog }) {
    // ... (keep existing implementation)
    return (
        <div className="bg-card border rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-[10px] ${moodLevelLabel[log.mood_score]?.color || ""}`}>
                    Humor: {log.mood_score}
                </Badge>
                {log.risk_flags?.map((flag, i) => (
                    <Badge key={i} variant="destructive" className="text-[10px]">{flag}</Badge>
                ))}
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

function ClinicalEvolutionEntry({ evolution }: { evolution: ClinicalEvolution }) {
    return (
        <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">
                {evolution.evolution_notes}
            </p>
            {evolution.doctor && (
                <p className="text-[10px] text-slate-500 mt-2">
                    Dr(a). {evolution.doctor.full_name}
                </p>
            )}
        </div>
    )
}

function MedicationEntry({ medication }: { medication: Medication }) {
    return (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Início: {medication.name}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Prescrição ativa
            </p>
        </div>
    )
}
