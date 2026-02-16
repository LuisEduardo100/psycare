"use client"

import { PatientHeader } from "@/components/patient/patient-header"
import { DailyLogForm } from "@/components/patient/daily-log-form"
import { useTranslations } from "next-intl"

export default function DailyLogPage() {
    const t = useTranslations("DailyLog")

    return (
        <>
            <PatientHeader showBack title={t("title") || "Registro Diário"} />
            <DailyLogForm />
        </>
    )
}
