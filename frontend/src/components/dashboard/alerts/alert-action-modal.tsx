"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, MessageCircle, Mail, User, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface Alert {
    id: string
    patient: {
        id: string
        user: {
            full_name: string
        }
        avatar_url?: string
    }
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    trigger_source: string
    status: 'PENDING' | 'VIEWED' | 'CONTACTED' | 'RESOLVED' | 'FALSE_POSITIVE'
    created_at: string
    resolution_notes?: string
    contact_method?: string
}

interface AlertActionModalProps {
    alert: Alert | null
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

const statusOptions = [
    { value: 'VIEWED', label: 'Visualizado', icon: CheckCircle2, color: 'text-blue-600' },
    { value: 'CONTACTED', label: 'Contatado', icon: Phone, color: 'text-amber-600' },
    { value: 'RESOLVED', label: 'Resolvido', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'FALSE_POSITIVE', label: 'Falso Positivo', icon: AlertTriangle, color: 'text-gray-600' },
]

const contactMethods = [
    { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
    { value: 'PHONE', label: 'Telefone', icon: Phone },
    { value: 'EMAIL', label: 'E-mail', icon: Mail },
    { value: 'IN_PERSON', label: 'Presencial', icon: User },
]

export function AlertActionModal({ alert, open, onClose, onSuccess }: AlertActionModalProps) {
    const [status, setStatus] = useState<string>('')
    const [contactMethod, setContactMethod] = useState<string>('')
    const [resolutionNotes, setResolutionNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!alert) return

        // Validation
        if (!status) {
            toast.error('Selecione um status')
            return
        }

        if ((status === 'RESOLVED' || status === 'FALSE_POSITIVE') && !resolutionNotes.trim()) {
            toast.error('Notas de resolução são obrigatórias para este status')
            return
        }

        if (status === 'CONTACTED' && !contactMethod) {
            toast.error('Selecione o método de contato')
            return
        }

        setLoading(true)
        try {
            await api.patch(`/alerts/${alert.id}`, {
                status,
                contact_method: contactMethod || undefined,
                resolution_notes: resolutionNotes.trim() || undefined,
            })

            toast.success('Alerta atualizado com sucesso')
            onSuccess()
            handleClose()
        } catch (error: any) {
            console.error('Failed to update alert', error)
            toast.error(error.response?.data?.message || 'Erro ao atualizar alerta')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setStatus('')
        setContactMethod('')
        setResolutionNotes('')
        onClose()
    }

    if (!alert) return null

    const severityColor = {
        HIGH: 'bg-red-100 text-red-700 border-red-200',
        MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
        LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Gerenciar Alerta
                    </DialogTitle>
                    <DialogDescription>
                        Atualize o status e registre as ações tomadas para este alerta.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Alert Info */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {alert.patient?.user?.full_name || "Paciente"}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {alert.trigger_source.replace(/_/g, ' ')}
                                </p>
                            </div>
                            <Badge variant="outline" className={severityColor[alert.severity]}>
                                {alert.severity}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                            Criado em: {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </p>
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Novo Status *</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map((option) => {
                                    const Icon = option.icon
                                    return (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className={`h-4 w-4 ${option.color}`} />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Method (only for CONTACTED status) */}
                    {status === 'CONTACTED' && (
                        <div className="space-y-2">
                            <Label htmlFor="contact-method">Método de Contato *</Label>
                            <Select value={contactMethod} onValueChange={setContactMethod}>
                                <SelectTrigger id="contact-method">
                                    <SelectValue placeholder="Como você contatou o paciente?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contactMethods.map((method) => {
                                        const Icon = method.icon
                                        return (
                                            <SelectItem key={method.value} value={method.value}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    {method.label}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Resolution Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            Notas de Resolução
                            {(status === 'RESOLVED' || status === 'FALSE_POSITIVE') && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Descreva as ações tomadas, observações ou motivo da resolução..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            {(status === 'RESOLVED' || status === 'FALSE_POSITIVE')
                                ? 'Obrigatório para este status'
                                : 'Opcional, mas recomendado para auditoria'}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
