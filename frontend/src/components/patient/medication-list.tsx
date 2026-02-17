"use client"

import { useEffect, useState } from "react"
import { Pill, Clock, AlertTriangle, FileText } from "lucide-react"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Prescription {
    id: string
    medication: {
        name: string
        concentration: string
        form: string
        safety_tips?: string
    }
    dosage: string
    frequency: string
    form?: string
    duration?: string
    instructions?: string
    start_date: string
    is_active: boolean
}

export function MedicationList() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMedication, setSelectedMedication] = useState<Prescription | null>(null)
    const t = useTranslations("Medications")

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const response = await api.get("/prescriptions")
                setPrescriptions(response.data)
            } catch (error) {
                console.error("Failed to fetch prescriptions", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPrescriptions()
    }, [])

    if (loading) {
        return (
            <div className="space-y-4 mt-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-sm animate-pulse">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (prescriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Pill className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                    {t("noMedications") || "Nenhum medicamento prescrito."}
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4 mt-4">
                {prescriptions.map((p) => (
                    <div
                        key={p.id}
                        className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedMedication(p)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${p.is_active
                                ? "bg-teal-50 text-teal-600"
                                : "bg-muted text-muted-foreground"
                                }`}>
                                <Pill className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground text-sm truncate">
                                        {p.medication.name}
                                    </h4>
                                    {/* Removed concentration badge to avoid confusion with prescribed dosage */}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {p.medication.form}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {p.frequency}
                                    </span>
                                    <Badge
                                        className={`text-[10px] ${p.is_active
                                            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                            : "bg-muted text-muted-foreground hover:bg-muted border-border"
                                            }`}
                                    >
                                        {p.is_active
                                            ? (t("active") || "Ativo")
                                            : (t("expired") || "Expirado")}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        {p.medication.safety_tips && (
                            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-amber-800 leading-snug">
                                    {p.medication.safety_tips}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedMedication} onOpenChange={(open) => !open && setSelectedMedication(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedMedication?.medication.name}</DialogTitle>
                        <DialogDescription>
                            {selectedMedication?.form || selectedMedication?.medication.form}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium leading-none">Dosagem Prescrita</h4>
                                <p className="text-sm text-muted-foreground">{selectedMedication?.dosage}</p>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium leading-none">Frequência</h4>
                                <p className="text-sm text-muted-foreground">{selectedMedication?.frequency}</p>
                            </div>

                            {selectedMedication?.duration && (
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium leading-none">Duração</h4>
                                    <p className="text-sm text-muted-foreground">{selectedMedication?.duration}</p>
                                </div>
                            )}
                        </div>

                        {selectedMedication?.instructions && (
                            <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                                <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Instruções Específicas
                                </h4>
                                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                                    {selectedMedication.instructions.split('. ').map((instruction, idx) => {
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
                        {!selectedMedication?.instructions && (
                            <div className="pt-2 border-t dark:border-slate-700">
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma instrução específica cadastrada pelo médico.
                                </p>
                            </div>
                        )}

                        {selectedMedication?.medication.safety_tips && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Atenção
                                </h4>
                                <p className="text-xs text-amber-700">{selectedMedication.medication.safety_tips}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
