"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
    Moon, Smile, Pill, Activity, Headphones, MoreHorizontal,
    Video, Calendar, CheckCircle, TrendingUp, ArrowRight, Clock, Bell
} from "lucide-react"
import { PatientHeader } from "@/components/patient/patient-header"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/routing"
import api from "@/lib/api"

interface DaySummary {
    sleepHours?: number
    sleepQuality?: string
    moodRating?: number
    moodCompleted?: boolean
}

interface NextAppointment {
    doctorName: string
    specialty: string
    date: string
    time: string
    modality: string
    daysUntil: number
}

interface TimelineEntry {
    id: string
    type: "medication" | "sleep" | "note"
    title: string
    description: string
    time: string
    icon: "pill" | "moon" | "clipboard"
}

export default function PatientAppPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const t = useTranslations("PatientApp")
    const [daySummary, setDaySummary] = useState<DaySummary | null>(null)
    const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null)
    const [timeline, setTimeline] = useState<TimelineEntry[]>([])
    const [doctor, setDoctor] = useState<{ name: string; specialty?: string } | null>(null)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login")
            return
        }
        if (user && user.role !== "PATIENT") {
            router.push("/dashboard")
            return
        }

        // Fetch day summary
        api.get("/daily-logs/today").then((res) => {
            setDaySummary(res.data)
        }).catch(() => {
            setDaySummary(null)
        })

        // Fetch next appointment
        // endpoint renamed to consultations/next (backend) to match controller
        api.get("/consultations/next").then((res) => {
            setNextAppointment(res.data)
        }).catch(() => {
            setNextAppointment(null)
        })

        // Fetch timeline
        // endpoint moved to users/me/timeline
        api.get("/users/me/timeline").then((res) => {
            setTimeline(res.data)
        }).catch(() => {
            setTimeline([])
        })

        // Fetch linked doctor
        api.get("/users/me/doctor").then((res) => {
            if (res.data) {
                setDoctor({
                    name: res.data.full_name,
                    specialty: res.data.specialty || "Psiquiatra"
                })
            }
        }).catch((err) => {
            console.error("Failed to fetch doctor info", err)
        })

        // Use nextAppointment as immediate fallback if doctor fetch hasn't completed or failed
        if (nextAppointment?.doctorName && !doctor) {
            setDoctor({
                name: nextAppointment.doctorName,
                specialty: nextAppointment.specialty
            })
        }
    }, [isAuthenticated, user, router, nextAppointment])

    if (!isAuthenticated || !user) {
        return null
    }

    const quickActions = [
        { icon: Pill, label: t("medication"), path: "/medications", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
        // Removed Symptoms button as requested
        { icon: Headphones, label: t("meditation"), path: "#", color: "bg-teal-50 text-teal-600 border-teal-100" },
        { icon: MoreHorizontal, label: t("other"), path: "#", color: "bg-muted text-muted-foreground border-border" },
    ]

    const iconMap = {
        pill: <Pill className="h-5 w-5" />,
        moon: <Moon className="h-5 w-5" />,
        clipboard: <CheckCircle className="h-5 w-5" />,
    }

    const colorMap = {
        medication: "bg-emerald-100 text-emerald-600 border-emerald-50",
        sleep: "bg-blue-100 text-blue-600 border-blue-50",
        note: "bg-purple-100 text-purple-600 border-purple-50",
    }

    return (
        <div className="pb-4 space-y-8">
            {/* Header Area */}
            <div className="md:flex md:justify-between md:items-end md:pb-4">
                <div className="md:hidden">
                    <PatientHeader />
                </div>
                <div className="hidden md:block">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                        Olá, {user.fullName?.split(" ")[0]}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                        {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="hidden md:flex gap-3">
                    <button className="px-4 py-2 bg-background border border-border rounded-lg text-primary text-sm font-bold flex items-center gap-2 hover:bg-primary/5 transition-colors">
                        <Bell className="h-5 w-5" />
                        Alertas
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Day Summary */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                {t("daySummary")}
                            </h3>
                            <span className="md:hidden text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Sleep Card */}
                            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:border-blue-200 transition-colors cursor-pointer">
                                <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Moon className="h-5 w-5" />
                                    </div>
                                    {daySummary?.sleepHours && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                </div>
                                <div className="relative z-10">
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{t("sleepHours")}</p>
                                    <p className="text-xl font-extrabold text-foreground">
                                        {daySummary?.sleepHours ? `${daySummary.sleepHours}h` : "—"}
                                    </p>
                                    {daySummary?.sleepQuality && (
                                        <p className="text-green-600 text-[10px] font-medium flex items-center mt-1">
                                            {t("quality")} {daySummary.sleepQuality}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Mood Card */}
                            <div
                                className="bg-card p-4 rounded-2xl shadow-sm border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:border-amber-300 transition-colors cursor-pointer"
                                onClick={() => router.push("/daily-log")}
                            >
                                <div className="absolute -right-4 -bottom-4 bg-orange-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500" />
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Smile className="h-5 w-5" />
                                    </div>
                                    {daySummary?.moodCompleted ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-100 text-amber-700 text-[10px] border-amber-200 font-bold">
                                            {t("pending")}
                                        </Badge>
                                    )}
                                </div>
                                <div className="relative z-10">
                                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{t("mood")}</p>
                                    {daySummary?.moodCompleted ? (
                                        <>
                                            <p className="text-xl font-extrabold text-foreground">
                                                {daySummary.moodRating === 1 ? "😢" : daySummary.moodRating === 2 ? "☹️" : daySummary.moodRating === 3 ? "😐" : daySummary.moodRating === 4 ? "🙂" : "😄"}
                                            </p>
                                            <p className="text-primary text-xs font-medium">Registrado</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-semibold text-foreground mt-1">{t("howAreYou")}</p>
                                            <button className="mt-1 text-xs text-amber-600 font-bold flex items-center">
                                                {t("registerNow")} <ArrowRight className="h-3 w-3 ml-1" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Next Appointment */}
                    <section>
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {t("nextAppointment")}
                        </h3>
                        {nextAppointment ? (
                            <div className="relative overflow-hidden bg-primary text-white p-6 rounded-xl shadow-lg group">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="size-16 rounded-full bg-white/20 border-2 border-white/30 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <span className="text-xs font-bold uppercase">{nextAppointment.date.split('/')[1] || "MÊS"}</span>
                                            <span className="text-2xl font-black">{nextAppointment.date.split('/')[0] || "DIA"}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold">{nextAppointment.doctorName}</h4>
                                            <p className="text-white/80 font-medium">{nextAppointment.specialty}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-white/90">
                                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {nextAppointment.time}</span>
                                                <span className="flex items-center gap-1"><Video className="h-4 w-4" /> {nextAppointment.modality}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="bg-white text-primary px-6 py-3 rounded-lg font-bold text-sm shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                        Ver Detalhes <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="absolute -right-10 -bottom-10 size-40 bg-white/10 rounded-full blur-3xl"></div>
                            </div>
                        ) : (
                            <div className="bg-muted/50 rounded-2xl p-6 text-center border border-border">
                                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">{t("noAppointments")}</p>
                            </div>
                        )}
                    </section>

                    {/* Timeline */}
                    <section>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                {t("timeline")}
                            </h3>
                            <button className="text-sm text-primary font-medium">{t("viewAll")}</button>
                        </div>
                        <div className="space-y-4">
                            {timeline.length > 0 ? timeline.map((entry, idx) => (
                                <div key={entry.id} className="relative pl-8 bg-card rounded-lg p-4 border border-border shadow-sm">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorMap[entry.type].split(" ")[0]} rounded-l-lg`}></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter">
                                            {entry.type === "medication" ? t("medicationLabel") : entry.type === "sleep" ? t("sleepLabel") : t("noteLabel")} • {entry.time}
                                        </Badge>
                                    </div>
                                    <h5 className="text-sm font-bold">{entry.title}</h5>
                                    <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground italic">Nenhuma atividade recente.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column (1/3) - Desktop Only mostly or stacked on mobile */}
                <div className="space-y-8">
                    {/* Quick Actions / Medications - Adapted */}
                    <section className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <h3 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                            Ações Rápidas
                            <MoreHorizontal className="h-5 w-5 text-primary" />
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => action.path !== "#" && router.push(action.path)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${action.color}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                                        <action.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Vitals Mockup */}
                    <section className="bg-card p-6 rounded-xl border border-border shadow-sm hidden md:block">
                        <h3 className="text-sm font-bold mb-6 text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                            Sinais Vitais
                            <Activity className="h-5 w-5 text-primary" />
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-border pb-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Pressão Arterial</p>
                                    <p className="text-lg font-extrabold text-foreground">120/80 <span className="text-xs font-normal text-muted-foreground">mmHg</span></p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">Normal</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Peso</p>
                                    <p className="text-lg font-extrabold text-foreground">78.5 <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-bold">-0.5kg</span>
                            </div>
                        </div>
                    </section>

                    {/* Acompanhado Por */}
                    <section className="p-6 bg-muted/50 rounded-xl hidden md:block border border-border/50">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Acompanhado por</p>
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background shadow-sm text-primary font-bold">
                                {doctor?.name ? doctor.name.charAt(0) : (nextAppointment?.doctorName ? nextAppointment.doctorName.charAt(0) : "D")}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground">
                                    {doctor?.name || nextAppointment?.doctorName || "Dr. Responsável"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {doctor?.specialty || nextAppointment?.specialty || "Psiquiatra"}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
