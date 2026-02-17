"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, FileSignature, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
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
}

interface ConsultationFinalizeModalProps {
    consultation: Consultation | null
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ConsultationFinalizeModal({ consultation, open, onClose, onSuccess }: ConsultationFinalizeModalProps) {
    const [signature, setSignature] = useState('')
    const [confirmChecked, setConfirmChecked] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleFinalize = async () => {
        if (!consultation) return

        // Validation
        if (!signature.trim()) {
            toast.error('Digite sua assinatura digital')
            return
        }

        if (!confirmChecked) {
            toast.error('Confirme que revisou todas as informações')
            return
        }

        setLoading(true)
        try {
            await api.patch(`/consultations/${consultation.id}/finalize`, {
                signature,
            })

            onSuccess()
            handleClose()
        } catch (error: any) {
            console.error('Failed to finalize consultation', error)
            toast.error(error.response?.data?.message || 'Erro ao finalizar consulta')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setSignature('')
        setConfirmChecked(false)
        onClose()
    }

    if (!consultation) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-primary" />
                        Finalizar Consulta
                    </DialogTitle>
                    <DialogDescription>
                        Ao finalizar, a consulta não poderá mais ser editada. Revise todas as informações antes de prosseguir.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Summary */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <h4 className="font-semibold text-sm mb-2">Resumo da Consulta</h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                <span className="font-medium">Data:</span>{' '}
                                {new Date(consultation.date_time).toLocaleString('pt-BR')}
                            </p>
                            <p>
                                <span className="font-medium">Duração:</span> {consultation.duration_minutes} minutos
                            </p>
                            <p>
                                <span className="font-medium">Modalidade:</span> {consultation.modality}
                            </p>
                            <p>
                                <span className="font-medium">CID-10:</span>{' '}
                                {consultation.icd10_codes.length > 0
                                    ? consultation.icd10_codes.join(', ')
                                    : 'Nenhum código registrado'}
                            </p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                                    Ação Irreversível
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Após finalizar, esta consulta ficará bloqueada para edição. Certifique-se de que todas as informações estão corretas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Digital Signature */}
                    <div className="space-y-2">
                        <Label htmlFor="signature">Assinatura Digital *</Label>
                        <Input
                            id="signature"
                            type="password"
                            placeholder="Digite sua senha para assinar"
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            autoComplete="current-password"
                        />
                        <p className="text-xs text-slate-500">
                            Sua senha será usada para gerar uma assinatura digital criptografada.
                        </p>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="confirm"
                            checked={confirmChecked}
                            onCheckedChange={(checked) => setConfirmChecked(checked === true)}
                        />
                        <label
                            htmlFor="confirm"
                            className="text-sm leading-tight cursor-pointer select-none"
                        >
                            Confirmo que revisei todas as informações da consulta (anamnese, CID-10, hipótese diagnóstica e plano de tratamento) e estou ciente de que não poderei mais editá-las.
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleFinalize} disabled={loading || !signature || !confirmChecked}>
                        {loading ? 'Finalizando...' : 'Finalizar e Assinar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
