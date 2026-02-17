"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, X, AlertTriangle, Pill, FileText } from "lucide-react"
import { toast } from "sonner"

interface Medication {
    id?: string
    medication_id?: string
    name: string
    dosage: string
    dosage_form: string
    frequency: string
    duration_days: number
    quantity?: string
    instructions?: string
}

interface Prescription {
    id?: string
    patient_id: string
    doctor_id: string
    consultation_id?: string
    prescription_date: string
    medications: Medication[]
    general_instructions?: string
    is_formal: boolean
    patient?: {
        user: { full_name: string }
    }
}

const DOSAGE_FORMS = [
    'Comprimido',
    'Cápsula',
    'Solução Oral',
    'Suspensão Oral',
    'Gotas',
    'Xarope',
    'Injetável',
    'Pomada',
    'Creme',
    'Gel',
    'Adesivo Transdérmico',
    'Supositório',
    'Spray Nasal',
    'Inalação',
]

export default function PrescriptionEditorPage() {
    const router = useRouter()
    const params = useParams()
    const { user, isAuthenticated } = useAuthStore()
    const patientId = params.id as string
    const prescriptionId = params.prescriptionId as string

    console.log('PrescriptionEditorPage - Params:', { patientId, prescriptionId })

    const [patient, setPatient] = useState<any>(null)
    const [medications, setMedications] = useState<Medication[]>([
        { medication_id: '', name: '', dosage: '', dosage_form: 'Comprimido', frequency: '', duration_days: 30, instructions: '' }
    ])
    const [generalInstructions, setGeneralInstructions] = useState('')
    const [loading, setLoading] = useState(false)
    const [medicationList, setMedicationList] = useState<any[]>([])
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [interactionWarnings, setInteractionWarnings] = useState<string[]>([])

    useEffect(() => {
        const fetchMeds = async () => {
            try {
                const res = await api.get('/medications')
                setMedicationList(res.data)
            } catch (error) {
                console.error('Failed to fetch medications', error)
            }
        }
        fetchMeds()
    }, [])

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            if (!patientId) return
            try {
                console.log('Fetching patient data for ID:', patientId)
                const patientRes = await api.get(`/users/patients/${patientId}`)
                console.log('Patient data received:', patientRes.data)
                setPatient(patientRes.data)

                // If editing existing prescription
                if (prescriptionId && prescriptionId !== 'new') {
                    console.log('Fetching existing prescription:', prescriptionId)
                    const prescRes = await api.get(`/formal-prescriptions/${prescriptionId}`)
                    const data = prescRes.data
                    // Map formal prescription items to local state
                    if (data.items) {
                        setMedications(data.items.map((item: any) => ({
                            medication_id: item.medication_id,
                            name: item.medication?.name || '',
                            dosage: item.dosage,
                            quantity: item.quantity,
                            instructions: item.instructions || ''
                        })))
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data', error)
                toast.error('Erro ao carregar dados')
            }
        }

        fetchData()
    }, [patientId, prescriptionId, isAuthenticated, router])

    const handleAddMedication = () => {
        setMedications([
            ...medications,
            { medication_id: '', name: '', dosage: '', dosage_form: 'Comprimido', frequency: '', duration_days: 30, instructions: '' }
        ])
    }

    const handleRemoveMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index))
    }

    const handleMedicationChange = (index: number, field: keyof Medication, value: any) => {
        console.log(`[MedicationChange] Index: ${index}, Field: ${field}, Value:`, value)
        setMedications(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    const validatePrescription = (): boolean => {
        const errors: string[] = []

        // RN-006: Cross-validation
        if (medications.length === 0) {
            errors.push('Adicione pelo menos um medicamento')
        }

        medications.forEach((med, idx) => {
            if (!med.name.trim()) {
                errors.push(`Medicamento ${idx + 1}: Nome é obrigatório`)
            }
            if (!med.dosage.trim()) {
                errors.push(`Medicamento ${idx + 1}: Dosagem é obrigatória`)
            }
            if (!med.frequency.trim()) {
                errors.push(`Medicamento ${idx + 1}: Frequência é obrigatória`)
            }
            if (med.duration_days <= 0) {
                errors.push(`Medicamento ${idx + 1}: Duração deve ser maior que zero`)
            }
        })

        setValidationErrors(errors)
        return errors.length === 0
    }

    const checkInteractions = async () => {
        // Simulate interaction checking (in production, call a real API)
        const warnings: string[] = []

        // Example: Check for duplicate medications
        const medNames = medications.map(m => m.name.toLowerCase().trim())
        const duplicates = medNames.filter((name, idx) => medNames.indexOf(name) !== idx && name)
        if (duplicates.length > 0) {
            warnings.push(`Medicamentos duplicados detectados: ${duplicates.join(', ')}`)
        }

        // Example: Check for common interactions (mock)
        const hasWarfarin = medNames.some(n => n.includes('warfarin'))
        const hasAspirin = medNames.some(n => n.includes('aspirina') || n.includes('ácido acetilsalicílico'))
        if (hasWarfarin && hasAspirin) {
            warnings.push('⚠️ Interação: Warfarin + Aspirina pode aumentar risco de sangramento')
        }

        setInteractionWarnings(warnings)
    }

    useEffect(() => {
        if (medications.some(m => m.name.trim())) {
            checkInteractions()
        }
    }, [medications])

    const handleSave = async () => {
        if (!validatePrescription()) {
            toast.error('Corrija os erros antes de salvar')
            return
        }

        setLoading(true)
        try {
            // Find a finalized consultation for the patient
            const finalizedConsultation = patient?.consultations?.find((c: any) => c.status === 'FINALIZED')

            if (!finalizedConsultation && prescriptionId === 'new') {
                toast.error('O paciente não possui consultas finalizadas. Não é possível gerar uma prescrição formal.')
                setLoading(false)
                return
            }

            const itemsPayload = medications.map(m => {
                // Ensure medication_id is present
                if (!m.medication_id) {
                    throw new Error(`Medicamento "${m.name}" inválido: ID não encontrado.`)
                }

                return {
                    medication_id: m.medication_id,
                    dosage: m.dosage,
                    quantity: m.quantity || '1 caixa',
                    form: m.dosage_form,
                    duration: m.duration_days ? `${m.duration_days} dias` : '',
                    instructions: m.instructions || '',
                    frequency: m.frequency || 'Conforme orientação médica'
                }
            })

            const consultationId = finalizedConsultation?.id || patient?.consultations?.[0]?.id;

            if (!consultationId) {
                toast.error('Vínculo obrigatório: Nenhuma consulta encontrada para este paciente.')
                setLoading(false)
                return
            }

            const payload = {
                patient_id: patientId,
                consultation_id: consultationId,
                type: 'SIMPLES',
                items: itemsPayload,
            }

            console.log('Final Payload extraction:', payload)

            if (prescriptionId && prescriptionId !== 'new') {
                console.log('Updating formal prescription:', prescriptionId)
                await api.patch(`/formal-prescriptions/${prescriptionId}`, payload)
                toast.success('Prescrição atualizada com sucesso')
            } else {
                console.log('Creating new formal prescription')
                await api.post('/formal-prescriptions', payload)
                toast.success('Prescrição criada com sucesso')
            }

            router.push(`/dashboard/patients/${patientId}`)
        } catch (error: any) {
            console.error('Failed to save prescription', error)
            const message = error.response?.data?.message || error.message
            if (Array.isArray(message)) {
                toast.error(message[0])
            } else {
                toast.error(message || 'Erro ao salvar prescrição')
            }
        } finally {
            setLoading(false)
        }
    }

    if (!isAuthenticated) return null

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 dark:bg-slate-900 lg:px-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {prescriptionId === 'new' ? 'Nova Prescrição' : 'Editar Prescrição'}
                        </h1>
                        {patient && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Paciente: <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {patient.user?.full_name || patient.full_name}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <FileText className="h-4 w-4 mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Prescrição'}
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1">
                                    {validationErrors.map((err, idx) => (
                                        <li key={idx} className="text-sm">{err}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Interaction Warnings */}
                    {interactionWarnings.length > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-900 dark:text-amber-100">
                                <ul className="list-disc list-inside space-y-1">
                                    {interactionWarnings.map((warn, idx) => (
                                        <li key={idx} className="text-sm">{warn}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Medications */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Medicamentos</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleAddMedication}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Medicamento
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {medications.map((med, idx) => (
                                <div key={idx} className="relative rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                                    {medications.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveMedication(idx)}
                                            className="absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}

                                    <div className="flex items-center gap-2 mb-4">
                                        <Pill className="h-5 w-5 text-primary" />
                                        <h4 className="font-semibold">Medicamento {idx + 1}</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Name */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor={`med-name-${idx}`}>Nome do Medicamento *</Label>
                                            <Select
                                                value={med.medication_id || undefined}
                                                onValueChange={(val) => {
                                                    const selected = medicationList.find(m => m.id === val)
                                                    setMedications(prev => {
                                                        const updated = [...prev]
                                                        updated[idx] = {
                                                            ...updated[idx],
                                                            medication_id: val,
                                                            name: selected?.name || ''
                                                        }
                                                        return updated
                                                    })
                                                }}
                                            >
                                                <SelectTrigger id={`med-name-${idx}`}>
                                                    <SelectValue placeholder="Selecione um medicamento" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {medicationList.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.name} {m.concentration ? `(${m.concentration})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                    {medicationList.length === 0 && (
                                                        <SelectItem value="none" disabled>Nenhum medicamento cadastrado</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Dosage */}
                                        <div className="space-y-2">
                                            <Label htmlFor={`med-dosage-${idx}`}>Dosagem *</Label>
                                            <Input
                                                id={`med-dosage-${idx}`}
                                                value={med.dosage}
                                                onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                                                placeholder="Ex: 20mg"
                                            />
                                        </div>

                                        {/* Dosage Form */}
                                        <div className="space-y-2">
                                            <Label htmlFor={`med-form-${idx}`}>Forma Farmacêutica *</Label>
                                            <Select
                                                value={med.dosage_form}
                                                onValueChange={(val) => handleMedicationChange(idx, 'dosage_form', val)}
                                            >
                                                <SelectTrigger id={`med-form-${idx}`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DOSAGE_FORMS.map((form) => (
                                                        <SelectItem key={form} value={form}>
                                                            {form}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Frequency */}
                                        <div className="space-y-2">
                                            <Label htmlFor={`med-freq-${idx}`}>Frequência *</Label>
                                            <Input
                                                id={`med-freq-${idx}`}
                                                value={med.frequency}
                                                onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                                                placeholder="Ex: 1x ao dia, pela manhã"
                                            />
                                        </div>

                                        {/* Duration */}
                                        <div className="space-y-2">
                                            <Label htmlFor={`med-duration-${idx}`}>Duração (dias) *</Label>
                                            <Input
                                                id={`med-duration-${idx}`}
                                                type="number"
                                                value={med.duration_days}
                                                onChange={(e) => handleMedicationChange(idx, 'duration_days', parseInt(e.target.value) || 0)}
                                                min={1}
                                            />
                                        </div>

                                        {/* Instructions */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor={`med-instructions-${idx}`}>Instruções Específicas</Label>
                                            <Textarea
                                                id={`med-instructions-${idx}`}
                                                value={med.instructions}
                                                onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                                                placeholder="Ex: Tomar com alimentos, evitar álcool..."
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* General Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Instruções Gerais</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={generalInstructions}
                                onChange={(e) => setGeneralInstructions(e.target.value)}
                                placeholder="Orientações gerais para o paciente sobre a prescrição..."
                                rows={4}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
