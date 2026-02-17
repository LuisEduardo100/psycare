"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { Pill, Plus, AlertCircle, Printer } from "lucide-react"

interface Prescription {
    id: string
    dosage: string
    frequency: string
    start_date: string
    end_date: string | null
    is_active: boolean
    medication: {
        id: string
        name: string
        active_ingredient: string
        form: string | null
        is_controlled: boolean
        interaction_tags: string[]
    }
}

interface Props {
    prescriptions: Prescription[]
    patientId: string
}

export function PatientPrescriptions({ prescriptions, patientId }: Props) {
    const t = useTranslations("PatientDetail")

    const activePrescriptions = prescriptions.filter(p => p.is_active)
    const inactivePrescriptions = prescriptions.filter(p => !p.is_active)

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Pill className="h-5 w-5 text-emerald-600" />
                        {t("prescriptions")}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                            {activePrescriptions.length} {t("active")}
                        </Badge>
                        <Button size="sm" className="h-7 gap-1" onClick={() => window.location.href = `/dashboard/patients/${patientId}/prescriptions/new`}>
                            <Plus className="h-3 w-3" />
                            Nova
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {prescriptions.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        {t("noPrescriptions")}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activePrescriptions.map(prescription => (
                            <PrescriptionItem key={prescription.id} prescription={prescription} />
                        ))}
                        {inactivePrescriptions.length > 0 && (
                            <details className="mt-4">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                    {t("inactivePrescriptions")} ({inactivePrescriptions.length})
                                </summary>
                                <div className="space-y-3 mt-3 opacity-60">
                                    {inactivePrescriptions.map(prescription => (
                                        <PrescriptionItem key={prescription.id} prescription={prescription} />
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PrescriptionItem({ prescription }: { prescription: Prescription }) {
    const { medication } = prescription

    return (
        <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors group">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${prescription.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm font-medium">{medication.name}</span>
                </div>
                <div className="flex gap-1 items-center">
                    {medication.is_controlled && (
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                            Controlado
                        </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" title="Imprimir" onClick={() => window.print()}>
                        <Printer className="h-3 w-3 text-slate-500" />
                    </Button>
                </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pl-4">
                <p>{medication.active_ingredient} • {medication.form || "—"}</p>
                <p className="font-medium text-foreground">{prescription.dosage} — {prescription.frequency}</p>
                <p>
                    Início: {new Date(prescription.start_date).toLocaleDateString("pt-BR")}
                    {prescription.end_date && ` → ${new Date(prescription.end_date).toLocaleDateString("pt-BR")}`}
                </p>
            </div>
            {medication.interaction_tags && medication.interaction_tags.length > 0 && (
                <div className="flex items-start gap-1.5 pl-4 pt-1">
                    <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-600">
                        Interações: {medication.interaction_tags.join(", ")}
                    </p>
                </div>
            )}
        </div>
    )
}
