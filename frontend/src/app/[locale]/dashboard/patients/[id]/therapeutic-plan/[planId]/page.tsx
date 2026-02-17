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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuickEvolutionWidget } from "@/components/medical/quick-evolution-widget"
import { ArrowLeft, Plus, Target, CheckCircle2, Clock, XCircle, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface TherapeuticGoal {
    id?: string
    description: string
    target_date: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    progress_notes?: string
}

interface TherapeuticPlan {
    id?: string
    patient_id: string
    doctor_id: string
    consultation_id?: string
    start_date: string
    end_date?: string
    objectives: string
    interventions: string
    goals: TherapeuticGoal[]
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    patient?: {
        user: { full_name: string }
    }
}

const goalStatusConfig = {
    PENDING: { label: 'Pendente', icon: Clock, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    IN_PROGRESS: { label: 'Em Andamento', icon: Target, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    COMPLETED: { label: 'Concluída', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
    CANCELLED: { label: 'Cancelada', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function TherapeuticPlanPage() {
    const router = useRouter()
    const params = useParams()
    const { user, isAuthenticated } = useAuthStore()
    const patientId = params.id as string
    const planId = params.planId as string

    const [patient, setPatient] = useState<any>(null)
    const [plan, setPlan] = useState<TherapeuticPlan | null>(null)
    const [objectives, setObjectives] = useState('')
    const [interventions, setInterventions] = useState('')
    const [goals, setGoals] = useState<TherapeuticGoal[]>([])
    const [loading, setLoading] = useState(false)
    const [showQuickEvolution, setShowQuickEvolution] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            if (!patientId) return
            try {
                // Fetch patient
                console.log('TherapeuticPlanEditorPage - Fetching patient:', patientId)
                const patientRes = await api.get(`/users/patients/${patientId}`)
                console.log('TherapeuticPlanEditorPage - Patient data:', patientRes.data)
                setPatient(patientRes.data)

                // If editing existing plan
                if (planId && planId !== 'new') {
                    console.log('TherapeuticPlanEditorPage - Fetching plan:', planId)
                    const planRes = await api.get(`/therapeutic-plans/${planId}`)
                    const data = planRes.data
                    setPlan(data)

                    // Parse strategies back into objectives/interventions
                    const strategies = data.strategies || ''
                    if (strategies.includes('Objetivos: ') && strategies.includes('Intervenções: ')) {
                        const parts = strategies.split('\n\nIntervenções: ')
                        setObjectives(parts[0].replace('Objetivos: ', ''))
                        setInterventions(parts[1] || '')
                    } else {
                        setObjectives(strategies)
                    }

                    // Map goals back to frontend statuses
                    const mappedGoals = (data.short_term_goals || []).map((g: any) => ({
                        description: g.description,
                        target_date: g.target_date ? new Date(g.target_date).toISOString().split('T')[0] : '',
                        status: mapStatusToFrontend(g.status),
                        progress_notes: g.notes || ''
                    }))
                    setGoals(mappedGoals)
                }
            } catch (error) {
                console.error('Failed to fetch data', error)
                toast.error('Erro ao carregar dados')
            }
        }

        fetchData()
    }, [patientId, planId, isAuthenticated, router])

    const handleAddGoal = () => {
        setGoals([
            ...goals,
            {
                description: '',
                target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
                status: 'PENDING',
                progress_notes: '',
            }
        ])
    }

    const handleRemoveGoal = (index: number) => {
        setGoals(goals.filter((_, i) => i !== index))
    }

    const handleGoalChange = (index: number, field: keyof TherapeuticGoal, value: any) => {
        const updated = [...goals]
        updated[index] = { ...updated[index], [field]: value }
        setGoals(updated)
    }

    const mapStatusToBackend = (status: string) => {
        switch (status) {
            case 'PENDING': return 'pending'
            case 'IN_PROGRESS': return 'in_progress'
            case 'COMPLETED': return 'achieved'
            case 'CANCELLED': return 'abandoned'
            default: return 'pending'
        }
    }

    const mapStatusToFrontend = (status: string) => {
        switch (status) {
            case 'pending': return 'PENDING'
            case 'in_progress': return 'IN_PROGRESS'
            case 'achieved': return 'COMPLETED'
            case 'abandoned': return 'CANCELLED'
            default: return 'PENDING'
        }
    }

    const handleSave = async () => {
        if (!objectives.trim()) {
            toast.error('Defina os objetivos do plano terapêutico')
            return
        }

        setLoading(true)
        try {
            const basePayload = {
                strategies: `Objetivos: ${objectives}\n\nIntervenções: ${interventions}`,
                short_term_goals: goals.map(g => ({
                    description: g.description,
                    target_date: g.target_date ? new Date(g.target_date).toISOString() : undefined,
                    status: mapStatusToBackend(g.status),
                    notes: g.progress_notes
                })),
                review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Default 90 days
            }

            if (planId && planId !== 'new') {
                await api.patch(`/therapeutic-plans/${planId}`, basePayload)
                toast.success('Plano terapêutico atualizado')
            } else {
                await api.post('/therapeutic-plans', { ...basePayload, patient_id: patientId })
                toast.success('Plano terapêutico criado')
            }

            router.push(`/dashboard/patients/${patientId}`)
        } catch (error: any) {
            console.error('Failed to save plan', error)
            const message = error.response?.data?.message
            if (Array.isArray(message)) {
                toast.error(message[0]) // Show only first validation error
            } else {
                toast.error(message || 'Erro ao salvar plano')
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
                    <button
                        onClick={() => router.back()}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {planId === 'new' ? 'Novo Plano Terapêutico' : 'Editar Plano Terapêutico'}
                        </h2>
                        <p className="text-xs text-slate-500">
                            {patient?.user?.full_name || 'Carregando...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setShowQuickEvolution(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Evolução Rápida
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Plano'}
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Objectives */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Objetivos Terapêuticos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                                placeholder="Descreva os objetivos gerais do tratamento..."
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Interventions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Intervenções Planejadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={interventions}
                                onChange={(e) => setInterventions(e.target.value)}
                                placeholder="Descreva as intervenções e abordagens terapêuticas..."
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Goals (Kanban-style) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Metas Terapêuticas</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleAddGoal}>
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Meta
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {goals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma meta definida. Adicione metas específicas para acompanhar o progresso.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Group by status */}
                                    {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((status) => {
                                        const statusGoals = goals.map((g, idx) => ({ ...g, idx })).filter(g => g.status === status)
                                        const config = goalStatusConfig[status]
                                        const StatusIcon = config.icon

                                        return (
                                            <div key={status} className="space-y-2">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <StatusIcon className="h-4 w-4" />
                                                    <h4 className="font-semibold text-sm">{config.label}</h4>
                                                    <Badge variant="outline" className="ml-auto">
                                                        {statusGoals.length}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-2">
                                                    {statusGoals.map((goal) => (
                                                        <div
                                                            key={goal.idx}
                                                            className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 space-y-2"
                                                        >
                                                            <Textarea
                                                                value={goal.description}
                                                                onChange={(e) => handleGoalChange(goal.idx, 'description', e.target.value)}
                                                                placeholder="Descrição da meta..."
                                                                rows={2}
                                                                className="text-sm resize-none"
                                                            />
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Data Alvo</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={goal.target_date}
                                                                    onChange={(e) => handleGoalChange(goal.idx, 'target_date', e.target.value)}
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Status</Label>
                                                                <Select
                                                                    value={goal.status}
                                                                    onValueChange={(val) => handleGoalChange(goal.idx, 'status', val)}
                                                                >
                                                                    <SelectTrigger className="text-xs h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.entries(goalStatusConfig).map(([key, cfg]) => (
                                                                            <SelectItem key={key} value={key} className="text-xs">
                                                                                {cfg.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleRemoveGoal(goal.idx)}
                                                            >
                                                                Remover
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Evolution Widget */}
            {showQuickEvolution && (
                <QuickEvolutionWidget
                    patientId={patientId}
                    onClose={() => setShowQuickEvolution(false)}
                    onSuccess={() => {
                        toast.success('Evolução registrada')
                        setShowQuickEvolution(false)
                    }}
                />
            )}
        </div>
    )
}
