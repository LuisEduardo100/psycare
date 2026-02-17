"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CID10Autocomplete } from "@/components/medical/cid10-autocomplete"
import { ConsultationFinalizeModal } from "@/components/medical/consultation-finalize-modal"
import { ArrowLeft, Save, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Consultation {
    id: string
    patient_id: string
    doctor_id: string
    date_time: string
    duration_minutes: number
    modality: string
    status: 'DRAFT' | 'FINALIZED' | 'CANCELLED'
    anamnesis: string | null
    diagnostic_hypothesis: string | null
    treatment_plan: string | null
    icd10_codes: string[]
    signature_hash: string | null
    signed_at: string | null
    cancelled_reason: string | null
    patient?: {
        user: { full_name: string }
    }
}

export default function ConsultationEditorPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const { user, isAuthenticated } = useAuthStore()
    const consultationId = params.id as string
    const patientIdParam = searchParams.get('patientId')

    const [consultation, setConsultation] = useState<Consultation | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [anamnesis, setAnamnesis] = useState('')
    const [diagnosticHypothesis, setDiagnosticHypothesis] = useState('')
    const [treatmentPlan, setTreatmentPlan] = useState('')
    const [icd10Codes, setIcd10Codes] = useState<string[]>([])
    const [finalizeModalOpen, setFinalizeModalOpen] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const [setupMode, setSetupMode] = useState(false)
    const [setupDuration, setSetupDuration] = useState(60)
    const [setupModality, setSetupModality] = useState('PRESENCIAL')
    const [patientName, setPatientName] = useState('')

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchConsultation = async () => {
            try {
                if (consultationId === 'new') {
                    if (!patientIdParam) {
                        toast.error('Paciente não identificado para nova consulta')
                        router.push('/dashboard/patients')
                        return
                    }

                    // Fetch patient details for header
                    const patientRes = await api.get(`/users/patients/${patientIdParam}`)
                    const patientData = patientRes.data
                    setPatientName(patientData.user?.full_name || 'Paciente')
                    setSetupMode(true) // Enable setup mode
                } else {
                    const res = await api.get(`/consultations/${consultationId}`)
                    const data = res.data
                    setConsultation(data)
                    setAnamnesis(data.anamnesis || '')
                    setDiagnosticHypothesis(data.diagnostic_hypothesis || '')
                    setTreatmentPlan(data.treatment_plan || '')
                    setIcd10Codes(data.icd10_codes || [])
                }
            } catch (error) {
                console.error('Failed to fetch consultation', error)
                toast.error('Erro ao carregar consulta')
            } finally {
                setLoading(false)
            }
        }

        if (consultationId) {
            fetchConsultation()
        }
    }, [consultationId, patientIdParam, isAuthenticated, router, user])

    const handleStartConsultation = () => {
        setConsultation({
            id: 'new',
            patient_id: patientIdParam!,
            doctor_id: user?.userId || '',
            date_time: new Date().toISOString(),
            duration_minutes: setupDuration,
            modality: setupModality,
            status: 'DRAFT',
            anamnesis: '',
            diagnostic_hypothesis: '',
            treatment_plan: '',
            icd10_codes: [],
            signature_hash: null,
            signed_at: null,
            cancelled_reason: null,
            patient: {
                user: { full_name: patientName }
            }
        })
        setSetupMode(false)
    }

    // Autosave every 30 seconds
    useEffect(() => {
        if (!consultation || consultation.status !== 'DRAFT') return

        const interval = setInterval(() => {
            handleSaveDraft(true) // Silent save
        }, 30000)

        return () => clearInterval(interval)
    }, [consultation, anamnesis, diagnosticHypothesis, treatmentPlan, icd10Codes])

    const handleSaveDraft = async (silent = false) => {
        if (!consultation || consultation.status !== 'DRAFT') return

        setSaving(true)
        try {
            if (consultation.id === 'new') {
                // Create new consultation
                const res = await api.post('/consultations', {
                    patient_id: consultation.patient_id,
                    date_time: consultation.date_time,
                    duration_minutes: consultation.duration_minutes,
                    modality: consultation.modality,
                    anamnesis,
                    diagnostic_hypothesis: diagnosticHypothesis,
                    treatment_plan: treatmentPlan,
                    icd10_codes: icd10Codes,
                })

                const newConsultation = res.data
                setConsultation(newConsultation)
                setLastSaved(new Date())

                // Update URL without reload
                window.history.replaceState(null, '', `/dashboard/consultations/${newConsultation.id}`)

                if (!silent) toast.success('Rascunho criado')
            } else {
                // Update existing draft
                await api.patch(`/consultations/${consultation.id}/draft`, {
                    anamnesis,
                    diagnostic_hypothesis: diagnosticHypothesis,
                    treatment_plan: treatmentPlan,
                    icd10_codes: icd10Codes,
                })
                setLastSaved(new Date())
                if (!silent) toast.success('Rascunho salvo')
            }
        } catch (error: any) {
            console.error('Failed to save draft', error)
            if (!silent) {
                toast.error(error.response?.data?.message || 'Erro ao salvar rascunho')
            }
        } finally {
            setSaving(false)
        }
    }

    const handleFinalize = () => {
        if (!icd10Codes.length) {
            toast.error('Adicione pelo menos um código CID-10 antes de finalizar')
            return
        }
        setFinalizeModalOpen(true)
    }

    const handleFinalizeSuccess = () => {
        toast.success('Consulta finalizada com sucesso')
        router.push(`/dashboard/patients/${consultation?.patient_id}`)
    }

    if (!isAuthenticated) return null

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (setupMode) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Iniciar Nova Consulta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Paciente</Label>
                            <Input value={patientName} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Duração Estimada (minutos)</Label>
                            <Input
                                type="number"
                                value={setupDuration}
                                onChange={(e) => setSetupDuration(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Modalidade</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={setupModality}
                                onChange={(e) => setSetupModality(e.target.value)}
                            >
                                <option value="PRESENCIAL">Presencial</option>
                                <option value="ONLINE">Online</option>
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button onClick={handleStartConsultation}>Iniciar Atendimento</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!consultation) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-bold">Consulta não encontrada</h2>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        )
    }

    const statusConfig = {
        DRAFT: { label: 'Rascunho', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        FINALIZED: { label: 'Finalizada', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
        CANCELLED: { label: 'Cancelada', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
    }

    const isReadOnly = consultation.status !== 'DRAFT'
    const StatusIcon = statusConfig[consultation.status].icon

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 dark:bg-slate-900 lg:px-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            Consulta - {consultation.patient?.user?.full_name || 'Paciente'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {new Date(consultation.date_time).toLocaleString('pt-BR')} • {consultation.duration_minutes}min • {consultation.modality}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={statusConfig[consultation.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[consultation.status].label}
                    </Badge>
                    {!isReadOnly && (
                        <>
                            <Button variant="outline" onClick={() => handleSaveDraft()} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Rascunho'}
                            </Button>
                            <Button onClick={handleFinalize}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Finalizar Consulta
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                {isReadOnly && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100">Consulta Somente Leitura</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Esta consulta está {consultation.status === 'FINALIZED' ? 'finalizada' : 'cancelada'} e não pode ser editada.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {lastSaved && !isReadOnly && (
                    <div className="mb-4 text-xs text-slate-500 text-right">
                        Último salvamento: {lastSaved.toLocaleTimeString('pt-BR')}
                    </div>
                )}

                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Anamnesis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Anamnese</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={anamnesis}
                                onChange={(e) => setAnamnesis(e.target.value)}
                                placeholder="Descreva a história clínica do paciente, queixas principais, histórico de doenças..."
                                rows={8}
                                disabled={isReadOnly}
                                className="resize-none"
                            />
                        </CardContent>
                    </Card>

                    {/* CID-10 Codes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Códigos CID-10</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CID10Autocomplete
                                value={icd10Codes}
                                onChange={setIcd10Codes}
                                disabled={isReadOnly}
                            />
                        </CardContent>
                    </Card>

                    {/* Diagnostic Hypothesis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Hipótese Diagnóstica</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={diagnosticHypothesis}
                                onChange={(e) => setDiagnosticHypothesis(e.target.value)}
                                placeholder="Descreva a hipótese diagnóstica baseada na anamnese e exames..."
                                rows={5}
                                disabled={isReadOnly}
                                className="resize-none"
                            />
                        </CardContent>
                    </Card>

                    {/* Treatment Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Plano de Tratamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={treatmentPlan}
                                onChange={(e) => setTreatmentPlan(e.target.value)}
                                placeholder="Descreva o plano terapêutico, medicações, orientações..."
                                rows={6}
                                disabled={isReadOnly}
                                className="resize-none"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Finalize Modal */}
            <ConsultationFinalizeModal
                consultation={consultation}
                open={finalizeModalOpen}
                onClose={() => setFinalizeModalOpen(false)}
                onSuccess={handleFinalizeSuccess}
            />
        </div>
    )
}
