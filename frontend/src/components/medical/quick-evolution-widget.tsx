"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Smile, Meh, Frown } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

interface QuickEvolutionWidgetProps {
    patientId: string
    onClose: () => void
    onSuccess: () => void
}

const moodOptions = [
    { value: 'GOOD', label: 'Bom', icon: Smile, color: 'text-green-600' },
    { value: 'NEUTRAL', label: 'Neutro', icon: Meh, color: 'text-amber-600' },
    { value: 'BAD', label: 'Ruim', icon: Frown, color: 'text-red-600' },
]

export function QuickEvolutionWidget({ patientId, onClose, onSuccess }: QuickEvolutionWidgetProps) {
    const [notes, setNotes] = useState('')
    const [mood, setMood] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        const fullContent = mood ? `[Humor: ${moodOptions.find(o => o.value === mood)?.label}] ${notes}` : notes

        if (fullContent.length < 10) {
            toast.error('A evolução deve ter pelo menos 10 caracteres')
            return
        }

        setLoading(true)
        try {
            await api.post('/clinical-evolutions', {
                patient_id: patientId,
                type: 'NOTE',
                content: fullContent,
            })

            toast.success('Evolução registrada com sucesso')
            onSuccess()
        } catch (error: any) {
            console.error('Failed to save evolution', error)
            const message = error.response?.data?.message
            if (Array.isArray(message)) {
                toast.error(message[0]) // Show only first validation error
            } else {
                toast.error(message || 'Erro ao salvar evolução')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Evolução Rápida
                    </DialogTitle>
                    <DialogDescription>
                        Registre rapidamente uma evolução clínica para este paciente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Mood Assessment */}
                    <div className="space-y-2">
                        <Label htmlFor="mood">Avaliação de Humor (Opcional)</Label>
                        <Select value={mood} onValueChange={setMood}>
                            <SelectTrigger id="mood">
                                <SelectValue placeholder="Selecione o humor observado" />
                            </SelectTrigger>
                            <SelectContent>
                                {moodOptions.map((option) => {
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

                    {/* Evolution Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas de Evolução *</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Descreva a evolução do paciente, observações clínicas, mudanças no quadro..."
                            rows={6}
                            className="resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Registre observações sobre o progresso, sintomas, adesão ao tratamento, etc.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading || !notes.trim()}>
                        {loading ? 'Salvando...' : 'Salvar Evolução'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
