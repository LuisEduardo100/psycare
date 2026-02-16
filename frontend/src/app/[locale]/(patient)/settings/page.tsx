"use client"

import { SettingsForm } from "@/components/shared/settings-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PatientSettingsPage() {
    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil e Segurança</CardTitle>
                    <CardDescription>Gerencie sua senha e preferências.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm />
                </CardContent>
            </Card>
        </div>
    )
}
