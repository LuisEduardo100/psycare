"use client"

import { SettingsForm } from "@/components/shared/settings-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function DoctorSettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">Configurações</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil e Segurança</CardTitle>
                    <CardDescription>Gerencie sua senha e preferências da conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm />
                </CardContent>
            </Card>
        </div>
    )
}
