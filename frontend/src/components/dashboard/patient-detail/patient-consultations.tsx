"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { Stethoscope } from "lucide-react"

interface Consultation {
    id: string
    date_time: string
    duration_minutes: number
    modality: string
    status: string
    anamnesis: string | null
    diagnostic_hypothesis: string | null
    treatment_plan: string | null
    icd10_codes: string[]
}

interface Props {
    consultations: Consultation[]
}

const statusColors: Record<string, string> = {
    DRAFT: "bg-yellow-100 text-yellow-700 border-yellow-200",
    FINALIZED: "bg-green-100 text-green-700 border-green-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
}

export function PatientConsultations({ consultations }: Props) {
    const t = useTranslations("PatientDetail")

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Stethoscope className="h-5 w-5 text-sky-600" />
                        {t("consultations")}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {consultations.length} {t("total")}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {consultations.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                        {t("noConsultations")}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {consultations.map(consultation => (
                            <div key={consultation.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            {new Date(consultation.date_time).toLocaleDateString("pt-BR", {
                                                day: "2-digit", month: "short", year: "numeric"
                                            })}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(consultation.date_time).toLocaleTimeString("pt-BR", {
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] ${statusColors[consultation.status] || ""}`}>
                                        {consultation.status}
                                    </Badge>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                                    <span>{consultation.duration_minutes}min</span>
                                    <span>•</span>
                                    <span>{consultation.modality}</span>
                                </div>
                                {consultation.diagnostic_hypothesis && (
                                    <p className="text-xs text-foreground bg-muted/50 p-2 rounded">
                                        <span className="font-medium">{t("diagnosis")}: </span>
                                        {consultation.diagnostic_hypothesis}
                                    </p>
                                )}
                                {consultation.icd10_codes && consultation.icd10_codes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {consultation.icd10_codes.map(code => (
                                            <Badge key={code} variant="outline" className="text-[10px]">{code}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
