"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Target, ArrowRight, XCircle } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface Goal {
    id: string
    description: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    target_date?: string
    term?: 'SHORT' | 'MEDIUM' | 'LONG' // Added to track origin
}

interface TherapeuticPlan {
    id: string
    short_term_goals: Goal[]
    medium_term_goals: Goal[]
    long_term_goals: Goal[]
    review_date: string | null
    created_at: string
}

export default function MyGoalsPage() {
    const [plan, setPlan] = useState<TherapeuticPlan | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPlan()
    }, [])

    const fetchPlan = async () => {
        try {
            const response = await api.get('/therapeutic-plans/me/active')
            console.log('Plan response:', response.data)
            setPlan(response.data)
        } catch (error) {
            console.error('Failed to fetch plan', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 m-4">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum plano ativo</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-2">
                    Seu médico ainda não definiu um plano terapêutico com metas para você. Converse com ele na próxima consulta.
                </p>
            </div>
        )
    }

    // Helper to normalize backend status to frontend expectations
    const normalizeStatus = (status: string | undefined): Goal['status'] => {
        const s = (status || 'pending').toLowerCase()
        if (s === 'achieved' || s === 'completed') return 'COMPLETED'
        if (s === 'abandoned' || s === 'cancelled') return 'CANCELLED'
        if (s === 'in_progress') return 'IN_PROGRESS'
        return 'PENDING'
    }

    // Helper to calculate term based on target date
    const calculateTerm = (targetDate: string | undefined, defaultTerm: 'SHORT' | 'MEDIUM' | 'LONG'): 'SHORT' | 'MEDIUM' | 'LONG' => {
        if (!targetDate) return defaultTerm

        const now = new Date()
        const target = new Date(targetDate)
        const diffTime = target.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 90) return 'SHORT' // 3 months
        if (diffDays < 365) return 'MEDIUM' // < 1 year
        return 'LONG' // >= 1 year
    }

    // Flatten and tag goals
    const allGoals: Goal[] = [
        ...plan.short_term_goals.map((g, i) => ({ ...g, id: g.id || `short-${i}`, status: normalizeStatus(g.status), term: calculateTerm(g.target_date, 'SHORT') })),
        ...plan.medium_term_goals.map((g, i) => ({ ...g, id: g.id || `medium-${i}`, status: normalizeStatus(g.status), term: calculateTerm(g.target_date, 'MEDIUM') })),
        ...plan.long_term_goals.map((g, i) => ({ ...g, id: g.id || `long-${i}`, status: normalizeStatus(g.status), term: calculateTerm(g.target_date, 'LONG') }))
    ]

    const columns = {
        PENDING: { label: 'Pendente', color: 'bg-slate-100 dark:bg-slate-800/50', icon: Circle },
        IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 dark:bg-blue-900/20', icon: Clock },
        COMPLETED: { label: 'Concluído', color: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
        CANCELLED: { label: 'Cancelado', color: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
    }

    const termLabels = {
        SHORT: { label: 'Curto Prazo', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
        MEDIUM: { label: 'Médio Prazo', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        LONG: { label: 'Longo Prazo', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    }

    const GoalCard = ({ goal }: { goal: Goal }) => {
        const term = termLabels[goal.term || 'SHORT']

        return (
            <div className="p-3 mb-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-wider ${term.class}`}>
                        {term.label}
                    </Badge>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{goal.description}</p>
                {goal.target_date && (
                    <div className="flex items-center text-xs text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quadro de Metas</h1>
                    <p className="text-muted-foreground">Acompanhe o status das suas metas terapêuticas</p>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-[1000px] h-full pb-4">
                    {Object.entries(columns).map(([status, col]) => {
                        const goals = allGoals.filter(g => g.status === status)
                        const Icon = col.icon

                        return (
                            <div key={status} className={`flex-1 min-w-[280px] rounded-xl ${col.color} p-4 flex flex-col`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Icon className="w-4 h-4 text-slate-500" />
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{col.label}</h3>
                                    <Badge variant="secondary" className="ml-auto bg-white/50 dark:bg-black/30">
                                        {goals.length}
                                    </Badge>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {goals.length > 0 ? (
                                        goals.map((goal, i) => (
                                            <GoalCard key={i} goal={goal} />
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                            <p className="text-sm italic">Nenhuma meta</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
