"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { TrendingUp, Moon, Brain } from "lucide-react"
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, Legend, Area, ComposedChart,
} from "recharts"

interface DailyLog {
    id: string
    date: string
    mood_rating: number | null
    mood_level: number | null
    anxiety_level: number | null
    irritability_level: number | null
    sleep_hours: number | null
    sleep_quality: number | null
}

interface Props {
    dailyLogs: DailyLog[]
}

export function PatientMoodChart({ dailyLogs }: Props) {
    const t = useTranslations("PatientDetail")

    const chartData = useMemo(() => {
        return [...dailyLogs]
            .reverse()
            .map(log => {
                const d = new Date(log.date);
                // Fix: Use UTC date to prevent timezone shift (e.g., 2026-02-17T00:00 -> 16/02 21:00)
                const dateStr = `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;

                return {
                    date: dateStr,
                    mood: log.mood_level,
                    moodRating: log.mood_rating,
                    anxiety: log.anxiety_level,
                    irritability: log.irritability_level,
                    sleep: log.sleep_hours,
                    sleepQuality: log.sleep_quality,
                }
            })
    }, [dailyLogs])

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        {t("moodChart")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        {t("noDailyLogs")}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {t("moodSleepCorrelation")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Mood Level Chart (LCM) */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-violet-500" />
                            <span className="text-sm font-medium">{t("moodLevel")}</span>
                            <span className="text-xs text-muted-foreground">(-3 {t("depression")} → +3 {t("mania")})</span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                                <YAxis domain={[-3, 3]} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="mood"
                                    fill="hsl(262, 80%, 80%)"
                                    stroke="hsl(262, 80%, 50%)"
                                    fillOpacity={0.15}
                                    name={t("mood")}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "hsl(262, 80%, 50%)" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="anxiety"
                                    stroke="hsl(0, 80%, 60%)"
                                    name={t("anxiety")}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Sleep Chart */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Moon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{t("sleepHours")}</span>
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sleep"
                                    stroke="hsl(210, 80%, 55%)"
                                    name={t("sleepHours")}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "hsl(210, 80%, 55%)" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sleepQuality"
                                    stroke="hsl(210, 40%, 75%)"
                                    name={t("sleepQuality")}
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
