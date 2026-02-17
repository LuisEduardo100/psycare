"use client"

import { useEffect, useState } from "react"
import { useRouter } from "@/i18n/routing"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function ConfirmEmailPage({ params }: { params: { token: string } }) {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("Verificando seu email...")

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                await api.post('/auth/email/confirm', { token: params.token })
                setStatus("success")
                setMessage("Seu email foi atualizado com sucesso!")
                toast.success("Email confirmado!")
            } catch (error: any) {
                setStatus("error")
                setMessage(error.response?.data?.message || "Link inválido ou expirado.")
                toast.error("Erro ao confirmar email.")
            }
        }

        if (params.token) {
            confirmEmail()
        }
    }, [params.token])

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                        {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                        {status === "error" && <XCircle className="h-6 w-6 text-red-600" />}
                    </div>
                    <CardTitle>Confirmação de Email</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center gap-4">
                        {status === "success" && (
                            <Button onClick={() => router.push("/login")}>
                                Ir para Login
                            </Button>
                        )}
                        {status === "error" && (
                            <Button variant="outline" onClick={() => router.push("/login")}>
                                Voltar
                            </Button>
                        )}
                        {status === "loading" && (
                            <p className="text-sm text-muted-foreground">Aguarde um momento...</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
