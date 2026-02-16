"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, Scale, Ruler, Heart, AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

const genderMap: Record<string, string> = {
    MALE: "Masculino",
    FEMALE: "Feminino",
    OTHER: "Outro",
}

const maritalMap: Record<string, string> = {
    SINGLE: "Solteiro(a)",
    MARRIED: "Casado(a)",
    DIVORCED: "Divorciado(a)",
    WIDOWED: "Viúvo(a)",
    SEPARATED: "Separado(a)",
    UNION: "União Estável",
}

interface PatientInfoCardProps {
    patient: {
        cpf: string
        birth_date: string
        gender: string
        marital_status: string
        profession: string | null
        weight: number | null
        height: number | null
        main_complaint: string | null
        user: {
            full_name: string
            email: string
            phone: string | null
            created_at: string
            last_login: string | null
        }
        alerts: any[]
    }
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
    const t = useTranslations("PatientDetail")
    const age = calculateAge(patient.birth_date)
    const pendingAlerts = patient.alerts.filter((a: any) => a.status === "PENDING" || a.status === "VIEWED")

    return (
        <Card className="relative overflow-hidden">
            {pendingAlerts.length > 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            )}
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {t("patientInfo")}
                    </CardTitle>
                    {pendingAlerts.length > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {pendingAlerts.length} {t("activeAlerts")}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoItem icon={Calendar} label={t("age")} value={`${age} anos`} />
                    <InfoItem icon={User} label={t("gender")} value={genderMap[patient.gender] || patient.gender} />
                    <InfoItem icon={Heart} label={t("maritalStatus")} value={maritalMap[patient.marital_status] || patient.marital_status} />
                    <InfoItem icon={Mail} label={t("email")} value={patient.user.email} />
                    <InfoItem icon={Phone} label={t("phone")} value={patient.user.phone || "—"} />
                    {patient.weight && <InfoItem icon={Scale} label={t("weight")} value={`${patient.weight} kg`} />}
                    {patient.height && <InfoItem icon={Ruler} label={t("height")} value={`${patient.height} cm`} />}
                    {patient.profession && <InfoItem icon={User} label={t("profession")} value={patient.profession} />}
                </div>
                {patient.main_complaint && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
                        <p className="text-xs text-muted-foreground font-medium mb-1">{t("mainComplaint")}</p>
                        <p className="text-sm">{patient.main_complaint}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
            </div>
        </div>
    )
}
