"use client"

import { PatientRegistrationForm } from "@/components/dashboard/patient-registration-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/routing"

export default function NewPatientPage() {
    const router = useRouter()

    return (
        <div className="container mx-auto p-6 max-w-lg">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                ← Voltar
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Cadastrar Novo Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <PatientRegistrationForm />
                </CardContent>
            </Card>
        </div>
    )
}
