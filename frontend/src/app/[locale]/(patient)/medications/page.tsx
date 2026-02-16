"use client"

import { PatientHeader } from "@/components/patient/patient-header"
import { MedicationList } from "@/components/patient/medication-list"
import { useTranslations } from "next-intl"

export default function MedicationsPage() {
    const t = useTranslations("Medications")

    return (
        <>
            <PatientHeader showBack title={t("title") || "Meus Medicamentos"} />
            <MedicationList />
        </>
    )
}
