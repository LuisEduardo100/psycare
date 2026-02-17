"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, FileText, Activity, Pill, Calendar } from "lucide-react"
import { UserAvatar } from "@/components/shared/user-avatar"

export default function PatientReportPage() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [patient, setPatient] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) return

        const fetchPatient = async () => {
            try {
                const res = await api.get(`/users/patients/${id}`)
                setPatient(res.data)
            } catch (error) {
                console.error("Failed to fetch patient details", error)
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchPatient()
        }
    }, [id, isAuthenticated])

    const handlePrint = () => {
        window.print()
    }

    if (!isAuthenticated) return null

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (!patient) return null

    return (
        <div className="min-h-screen bg-slate-50 p-8 print:bg-white print:p-0">
            {/* No-Print Header / Controls */}
            <div className="mx-auto mb-8 flex max-w-[210mm] items-center justify-between print:hidden">
                <Button variant="outline" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <h1 className="text-xl font-bold text-slate-900">Pré-visualização do Relatório</h1>
                <Button onClick={handlePrint} className="gap-2 bg-primary text-white hover:bg-primary/90">
                    <Printer className="h-4 w-4" /> Imprimir
                </Button>
            </div>

            {/* A4 Page Container */}
            <div className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[20mm] shadow-lg print:min-h-0 print:w-full print:shadow-none">

                {/* Report Header */}
                <header className="mb-8 border-b border-slate-900 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">Relatório Clínico</h1>
                            <p className="text-sm text-slate-500">Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-slate-900">PsyCare</h2>
                            <p className="text-sm text-slate-500">Dr. {user?.fullName}</p>
                            <p className="text-sm text-slate-500">CRM {user?.crm || '00000-UF'}</p>
                        </div>
                    </div>
                </header>

                {/* Patient Info */}
                <section className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6 print:border-slate-300 print:bg-transparent">
                    <div className="flex items-center gap-6">
                        {/* Avatar Removed as per request */}
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">{patient.user?.full_name}</h3>
                            <div className="flex gap-6 text-sm text-slate-600">
                                <span><strong>Idade:</strong> {patient.birth_date ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()} anos` : 'N/A'}</span>
                                <span><strong>Gênero:</strong> {patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Feminino' : 'Outro'}</span>
                                <span><strong>CPF:</strong> {patient.cpf || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Clinical Summary */}
                <div className="grid grid-cols-2 gap-8">
                    <section className="mb-8">
                        <h4 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                            <Activity className="h-4 w-4" /> Diagnóstico & Alertas
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs font-bold uppercase text-slate-500">Diagnóstico Principal</span>
                                <p className="font-medium text-slate-900">F33.1 - Transtorno depressivo recorrente, episódio atual moderado</p>
                            </div>
                            {patient.alerts && patient.alerts.length > 0 && (
                                <div>
                                    <span className="block text-xs font-bold uppercase text-slate-500">Alertas Recentes</span>
                                    <ul className="list-inside list-disc text-sm text-slate-700">
                                        {patient.alerts.slice(0, 3).map((alert: any) => (
                                            <li key={alert.id}>
                                                {alert.type} <span className="text-xs text-slate-500">({new Date(alert.created_at).toLocaleDateString()})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mb-8">
                        <h4 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                            <Pill className="h-4 w-4" /> Medicações Ativas
                        </h4>
                        {patient.prescriptions && patient.prescriptions.length > 0 ? (
                            <ul className="space-y-2">
                                {patient.prescriptions.map((p: any) => (
                                    <li key={p.id} className="text-sm">
                                        <div className="font-bold text-slate-900">{p.medication?.name}</div>
                                        <div className="text-slate-600">{p.dosage} • {p.frequency}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm italic text-slate-500">Nenhuma medicação ativa.</p>
                        )}
                    </section>
                </div>

                {/* Recent History Table */}
                <section className="mb-12">
                    <h4 className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
                        <Calendar className="h-4 w-4" /> Histórico Recente (Últimos 5 Eventos)
                    </h4>

                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="pb-2 font-bold text-slate-700">Data</th>
                                <th className="pb-2 font-bold text-slate-700">Tipo</th>
                                <th className="pb-2 font-bold text-slate-700">Descrição/Resumo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Consultations */}
                            {patient.consultations?.slice(0, 3).map((c: any) => (
                                <tr key={c.id}>
                                    <td className="py-2 text-slate-600">{new Date(c.date_time).toLocaleDateString()}</td>
                                    <td className="py-2"><span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 print:bg-transparent print:p-0 print:text-slate-900">Consulta</span></td>
                                    <td className="py-2 text-slate-900">{c.modality} - {c.status}</td>
                                </tr>
                            ))}
                            {/* Daily Logs */}
                            {patient.dailyLogs?.slice(0, 3).map((l: any) => (
                                <tr key={l.id}>
                                    <td className="py-2 text-slate-600">{new Date(l.date).toLocaleDateString()}</td>
                                    <td className="py-2"><span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 print:bg-transparent print:p-0 print:text-slate-900">Diário</span></td>
                                    <td className="py-2 text-slate-900">
                                        Humor: {l.mood_level} | Sono: {l.sleep_hours}h
                                        {l.notes && <div className="mt-1 text-xs italic text-slate-500 truncate max-w-[300px]">"{l.notes}"</div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Footer / Signature */}
                <footer>
                    <div className="grid grid-cols-2 gap-16">
                        <div className="text-center">
                            <div className="border-t border-slate-900 pt-2">
                                <p className="font-bold text-slate-900">{patient.user?.full_name}</p>
                                <p className="text-xs text-slate-500">Paciente</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-900 pt-2">
                                <p className="font-bold text-slate-900">Dr. {user?.fullName}</p>
                                <p className="text-xs text-slate-500">Médico Responsável (CRM {user?.crm || '_____'})</p>
                            </div>
                        </div>
                    </div>
                </footer>

            </div>

            <style jsx global>{`
                @media print {
                    /* Hide Dashboard Layout Elements */
                    aside, nav, .bottom-nav, footer.bg-white, .sidebar-container { 
                        display: none !important; 
                    }
                    
                    /* Reset Main Container Margins/Padding from Dashboard Layout */
                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                    }

                    /* Ensure Body is white */
                    body {
                        background-color: white !important; 
                        color: black !important;
                    }

                    /* Remove Browser headers/footers if possible (Chrome/Edge) */
                    @page {
                        margin: 0;
                        size: auto; 
                    }
                }
            `}</style>
        </div>
    )
}
