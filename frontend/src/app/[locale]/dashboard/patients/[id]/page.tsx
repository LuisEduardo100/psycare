"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "@/i18n/routing"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Plus, AlertTriangle, Moon, Edit, Activity, FileText, ChevronLeft, ChevronRight, Target, Clock } from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts'
import { UserAvatar } from "@/components/shared/user-avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function PatientDetailPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    console.log('PatientDetailPage - ID:', id)

    const [patient, setPatient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
    const [chartRange, setChartRange] = useState<'7d' | '30d' | '6m'>('30d')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 2

    // Sort logs descending for timeline (newest first)
    const sortedLogs = patient?.dailyLogs ? [...patient.dailyLogs].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []
    const totalPages = Math.ceil(sortedLogs.length / itemsPerPage)
    const currentLogs = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchPatient = async () => {
            try {
                const res = await api.get(`/users/patients/${id}`)
                setPatient(res.data)
            } catch (error) {
                console.error("Failed to fetch patient details", error)
                toast.error("Erro ao carregar dados do paciente")
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchPatient()
        }
    }, [id, isAuthenticated])

    const getFilteredLogs = () => {
        if (!patient?.dailyLogs) return []

        const now = new Date()
        const cutoff = new Date()
        cutoff.setHours(0, 0, 0, 0) // Normalize to midnight

        if (chartRange === '7d') cutoff.setDate(now.getDate() - 7)
        if (chartRange === '30d') cutoff.setDate(now.getDate() - 30)
        if (chartRange === '6m') cutoff.setMonth(now.getMonth() - 6)

        return patient.dailyLogs.filter((log: any) => {
            const logDate = new Date(log.date)
            // Compare timestamps to be safe, or just use date string if possible
            // But since log.date might be UTC, let's just check if it's generally after cutoff
            return logDate >= cutoff
        })
    }

    if (!isAuthenticated) return null

    if (loading) {
        return <div className="flex h-96 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
    }

    if (!patient) {
        return <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Paciente não encontrado</h2>
            <Button onClick={() => router.back()}>Voltar</Button>
        </div>
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-slate-900">
            {/* Top Header */}
            <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visão 360° do Paciente</h2>
                        <nav className="flex items-center gap-1 text-xs text-slate-400">
                            <span className="cursor-pointer hover:text-primary" onClick={() => router.push('/dashboard/patients')}>Pacientes</span>
                            <span>/</span>
                            <span className="font-medium text-primary">{patient.user?.full_name}</span>
                        </nav>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        onClick={() => {
                            if (patient.activeTherapeuticPlanId) {
                                router.push(`/dashboard/patients/${id}/therapeutic-plan/${patient.activeTherapeuticPlanId}`)
                            } else {
                                router.push(`/dashboard/patients/${id}/therapeutic-plan/new`)
                            }
                        }}
                    >
                        <Target className="h-4 w-4" />
                        Plano Terapêutico
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        onClick={() => router.push(`/dashboard/patients/${id}/report`)}
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir Relatório
                    </Button>
                    <Button
                        className="gap-2 bg-primary font-bold shadow-sm shadow-primary/20 hover:bg-primary/90"
                        onClick={() => {
                            if (patient.draftConsultationId) {
                                router.push(`/dashboard/consultations/${patient.draftConsultationId}`)
                            } else {
                                router.push(`/dashboard/consultations/new?patientId=${id}`)
                            }
                        }}
                    >
                        {patient.draftConsultationId ? (
                            <>
                                <Edit className="h-4 w-4" />
                                Continuar Consulta
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                Nova Consulta
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push(`/dashboard/patients/${id}/history`)}
                    >
                        <Clock className="h-4 w-4" />
                        Histórico
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                {/* Patient Profile Summary Card */}
                <div className="mb-8 flex flex-col items-start gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row">
                    <div className="flex flex-1 items-center gap-6">
                        <div className="h-24 w-24 shrink-0 font-bold text-3xl">
                            <UserAvatar
                                userId={patient.user?.id}
                                fallbackName={patient.user?.full_name}
                                className="h-full w-full rounded-2xl border-2 border-slate-50 shadow-sm"
                                hasAvatar={!!patient.user?.profile_picture}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {patient.user?.full_name}
                                </h3>
                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                    Caso Ativo
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 lg:grid-cols-4">
                                {/* CPF Removed as per request */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Idade / Gênero</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {patient.birth_date ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos` : 'N/A'}, {patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Feminino' : 'Outro'}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Diagnóstico</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">ICD-10 F33.1</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Última Visita</span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {patient.consultations?.[0]?.date_time ? new Date(patient.consultations[0].date_time).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Left: Main Clinical Trends */}
                    <div className="col-span-12 space-y-8 lg:col-span-8">
                        {/* Chart Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Afetivograma (Tendências de Humor)</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Monitoramento diário via app do paciente</p>
                                </div>
                                <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
                                    <button
                                        onClick={() => setChartRange('7d')}
                                        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-colors ${chartRange === '7d' ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                    >
                                        7 Dias
                                    </button>
                                    <button
                                        onClick={() => setChartRange('30d')}
                                        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-colors ${chartRange === '30d' ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                    >
                                        30 Dias
                                    </button>
                                    <button
                                        onClick={() => setChartRange('6m')}
                                        className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-colors ${chartRange === '6m' ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                                    >
                                        6 Meses
                                    </button>
                                </div>
                            </div>

                            {/* Visual Chart with Recharts */}
                            <div className="h-64 w-full min-h-[256px]">
                                {getFilteredLogs().length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={[...getFilteredLogs()]
                                                .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .map((log: any) => {
                                                    const d = new Date(log.date);
                                                    return {
                                                        date: `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`, // UTC fix
                                                        mood: log.mood_rating || 0
                                                    }
                                                })
                                            }
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0d968b" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#0d968b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                domain={[0, 5]}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                ticks={[0, 1, 2, 3, 4, 5]}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ stroke: '#0d968b', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area type="monotone" dataKey="mood" stroke="#0d968b" fillOpacity={1} fill="url(#colorMood)" tooltipType="none" />
                                            <Line
                                                type="monotone"
                                                dataKey="mood"
                                                name="Humor"
                                                stroke="#0d968b"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#fff', stroke: '#0d968b', strokeWidth: 2 }}
                                                activeDot={{ r: 6, fill: '#0d968b', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                                        Nenhum dado de humor registrado para este período.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chronological Evolutions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Linha do Tempo Clínica</h4>
                                <span className="text-xs text-slate-500">
                                    Página {currentPage} de {totalPages || 1}
                                </span>
                            </div>

                            {/* Render Daily Logs */}
                            {currentLogs.map((log: any) => (
                                <div key={log.id} className="rounded-xl border-l-4 border-primary border-y border-r border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:border-l-primary dark:bg-slate-800">
                                    <div className="mb-4 flex justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Moon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold leading-none text-slate-900 dark:text-white">Registro Diário</h5>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {(() => {
                                                        const d = new Date(log.date);
                                                        const dateStr = `${d.getUTCDate().toString().padStart(2, '0')} de ${['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
                                                        const weekDay = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][d.getUTCDay()];
                                                        return `${weekDay}, ${dateStr}`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-bold uppercase leading-none tracking-widest text-slate-400">Paciente</p>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Auto-relato</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                        {/* Coluna 1: Humor & Sentimentos */}
                                        <div className="space-y-3 border-r border-slate-100 pr-4 dark:border-slate-700">
                                            <h6 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                                <Activity className="h-3 w-3" /> Estado Emocional
                                            </h6>

                                            <div className="space-y-2">
                                                {/* Humor Geral */}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Humor (1-5):</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{log.mood_rating ?? '-'}</span>
                                                </div>

                                                {/* Polaridade */}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Polaridade (-3 a +3):</span>
                                                    <span className={`font-bold ${log.mood_level > 0 ? 'text-amber-500' : log.mood_level < 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                                                        {log.mood_level > 0 ? `+${log.mood_level} (Euforia)` : log.mood_level < 0 ? `${log.mood_level} (Depress)` : '0 (Eutimia)'}
                                                    </span>
                                                </div>

                                                {/* Ansiedade */}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Ansiedade:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {['Nenhuma', 'Leve', 'Moderada', 'Grave'][log.anxiety_level] || 'Não informado'}
                                                    </span>
                                                </div>

                                                {/* Irritabilidade */}
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Irritabilidade:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {['Nenhuma', 'Leve', 'Moderada', 'Grave'][log.irritability_level] || 'Não informado'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coluna 2: Sono & Físico */}
                                        <div className="space-y-3">
                                            <h6 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                                <Moon className="h-3 w-3" /> Fisiologia & Sono
                                            </h6>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Tempo de Sono:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{log.sleep_hours ? `${log.sleep_hours}h` : 'Não informado'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Qualidade (1-5):</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{log.sleep_quality ?? '-'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-600 dark:text-slate-400">Dificuldade p/ dormir:</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{log.sleep_difficulty ? 'Sim' : 'Não'}</span>
                                                </div>
                                            </div>

                                            {/* Efeitos Adversos / Sintomas Físicos */}
                                            {log.symptoms && log.symptoms.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="mb-1 text-[10px] font-bold uppercase text-slate-400">Sintomas / Efeitos Adversos</h6>
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.symptoms.map((sym: string, idx: number) => (
                                                            <span key={idx} className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                                                {sym}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notas / Descrição do Dia */}
                                    {log.notes && (
                                        <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                                            <h6 className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                <FileText className="h-3 w-3" /> "Como você está se sentindo hoje?"
                                            </h6>
                                            <p className="whitespace-pre-wrap text-sm italic text-slate-600 dark:text-slate-400">
                                                "{log.notes}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="gap-1"
                                    >
                                        Próximo <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {(!patient.dailyLogs || patient.dailyLogs.length === 0) && (
                                <div className="rounded-xl border-l-4 border-slate-200 border-y border-r border-slate-100 bg-white p-6 opacity-80 shadow-sm dark:border-slate-700 dark:border-l-slate-600 dark:bg-slate-800">
                                    <div className="text-center text-sm text-slate-500">Nenhum registro recente encontrado.</div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Sidebar Cards */}
                    <div className="col-span-12 space-y-6 lg:col-span-4">
                        {/* Clinical Alerts */}
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4 dark:border-red-900/30 dark:bg-red-900/20">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
                                    <AlertTriangle className="h-4 w-4" /> Alertas Clínicos
                                </h4>
                                <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {patient.alerts?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-4 p-5">
                                {patient.alerts?.map((alert: any) => (
                                    <div key={alert.id} className="flex items-start gap-3">
                                        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{alert.type}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(alert.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!patient.alerts || patient.alerts.length === 0) && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum alerta ativo.</p>
                                )}
                            </div>
                        </div>

                        {/* Active Medications */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Medicações Ativas</h4>
                                <Edit className="h-4 w-4 cursor-pointer text-slate-400 hover:text-primary" />
                            </div>
                            <div className="space-y-4">
                                {patient.prescriptions?.map((prescription: any) => (
                                    <div
                                        key={prescription.id}
                                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        onClick={() => setSelectedPrescription(prescription)}
                                    >
                                        <div className="mb-1 flex items-start justify-between">
                                            <p className="text-sm font-bold text-primary">{prescription.medication?.name}</p>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {prescription.medication?.form}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{prescription.frequency}</span>
                                        </div>
                                    </div>
                                ))}

                                {(!patient.prescriptions || patient.prescriptions.length === 0) && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma medicação registrada.</p>
                                )}

                                <button
                                    onClick={() => router.push(`/dashboard/patients/${id}/prescriptions/new`)}
                                    className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-500 transition-colors hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-400 dark:hover:text-primary"
                                >
                                    + Adicionar Prescrição
                                </button>
                            </div>
                        </div>

                        {/* Prescription Detail Dialog */}
                        <Dialog open={!!selectedPrescription} onOpenChange={(open) => !open && setSelectedPrescription(null)}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{selectedPrescription?.medication?.name}</DialogTitle>
                                    <DialogDescription>
                                        {selectedPrescription?.form || selectedPrescription?.medication?.form}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium leading-none">Dosagem Prescrita</h4>
                                            <p className="text-sm text-muted-foreground">{selectedPrescription?.dosage}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium leading-none">Frequência</h4>
                                            <p className="text-sm text-muted-foreground">{selectedPrescription?.frequency}</p>
                                        </div>

                                        {selectedPrescription?.duration && (
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-medium leading-none">Duração</h4>
                                                <p className="text-sm text-muted-foreground">{selectedPrescription?.duration}</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedPrescription?.instructions && (
                                        <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                                            <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary" />
                                                Instruções Específicas
                                            </h4>
                                            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                                {selectedPrescription.instructions.split('. ').map((instruction: string, idx: number) => {
                                                    const trimmed = instruction.trim();
                                                    // Skip old bundled fields
                                                    if (trimmed.startsWith('Forma:') || trimmed.startsWith('Frequência:') || trimmed.startsWith('Duração:')) {
                                                        return null;
                                                    }
                                                    return trimmed && <li key={idx}>{trimmed}</li>
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {!selectedPrescription?.instructions && (
                                        <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                                            <p className="text-sm text-muted-foreground italic">
                                                Nenhuma instrução específica cadastrada para esta medicação.
                                            </p>
                                        </div>
                                    )}

                                    {selectedPrescription?.medication?.safety_tips && (
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30">
                                            <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-2 dark:text-amber-400">
                                                <AlertTriangle className="h-4 w-4" />
                                                Observações de Segurança
                                            </h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-300">{selectedPrescription.medication.safety_tips}</p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Vital Signs Summary */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <h4 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">Sinais Vitais Recentes</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-700/50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Peso</p>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">74.2 <span className="text-xs font-normal">kg</span></p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-700/50">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">PA</p>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">120/80</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
