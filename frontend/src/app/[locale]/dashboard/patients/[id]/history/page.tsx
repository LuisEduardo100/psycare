"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, FileText, CheckCircle2, Clock, Play } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface HistoryData {
    consultations: any[]
    plans: any[]
}

export default function PatientHistoryPage() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<HistoryData | null>(null)
    const [loading, setLoading] = useState(true)

    const id = params.id as string
    const effectRan = useRef(false)

    useEffect(() => {
        if (!effectRan.current) {
            fetchHistory()
            return () => {
                effectRan.current = true
            }
        }
    }, [id])

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/therapeutic-plans/patient/${id}/history`)
            setData(response.data)
        } catch (error) {
            console.error('Failed to fetch history', error)
            toast.error('Erro ao carregar histórico')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Histórico do Paciente</h1>
                    <p className="text-muted-foreground">Consultas e Planos Terapêuticos</p>
                </div>
            </div>

            <Tabs defaultValue="consultations" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="consultations">Consultas</TabsTrigger>
                    <TabsTrigger value="plans">Planos Terapêuticos</TabsTrigger>
                </TabsList>

                <TabsContent value="consultations" className="space-y-4 mt-4">
                    {data?.consultations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            Nenhuma consulta registrada.
                        </div>
                    ) : (
                        data?.consultations.map((consultation) => (
                            <Card key={consultation.id} className="overflow-hidden">
                                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 py-3 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <span className="font-semibold text-sm">
                                            {new Date(consultation.date_time).toLocaleDateString('pt-BR')} às {new Date(consultation.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <Badge variant={
                                        consultation.status === 'FINALIZED' ? 'default' :
                                            consultation.status === 'DRAFT' ? 'secondary' : 'destructive'
                                    }>
                                        {consultation.status === 'FINALIZED' ? 'Finalizada' :
                                            consultation.status === 'DRAFT' ? 'Rascunho' : 'Cancelada'}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1">Duração</span>
                                            {consultation.duration_minutes} min
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1">Modalidade</span>
                                            {consultation.modality}
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1">Médico</span>
                                            {consultation.doctor?.full_name}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/consultations/${consultation.id}`)}>
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="plans" className="space-y-4 mt-4">
                    {data?.plans.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            Nenhum plano terapêutico registrado.
                        </div>
                    ) : (
                        data?.plans.map((plan) => (
                            <Card key={plan.id}>
                                <CardHeader className="py-3 flex flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-500" />
                                        <span className="font-semibold text-sm">
                                            Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    {plan.deleted_at && <Badge variant="destructive">Excluído</Badge>}
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-muted-foreground">
                                            Criado por: <span className="text-foreground font-medium">{plan.doctor?.full_name}</span>
                                        </div>
                                        <Button size="sm" onClick={() => router.push(`/dashboard/patients/${id}/therapeutic-plan/${plan.id}`)}>
                                            Visualizar / Editar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
