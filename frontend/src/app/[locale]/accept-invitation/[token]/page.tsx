
"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const router = useRouter()
    const { login } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [userData, setUserData] = useState<{ email: string; fullName: string } | null>(null)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    useEffect(() => {
        async function validateToken() {
            try {
                const res = await api.get(`/auth/invitation/validate/${token}`)
                setUserData(res.data)
            } catch (error: any) {
                console.error(error)
                toast.error("Convite inválido ou expirado.")
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }
        if (token) {
            validateToken()
        }
    }, [token, router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem.")
            return
        }
        if (password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres.")
            return
        }

        setSubmitting(true)
        try {
            const res = await api.post("/auth/invitation/accept", {
                token: token,
                password,
            })

            // Login user
            login(res.data.access_token)

            toast.success("Conta criada com sucesso!")
            router.push("/app") // Redirect to patient dashboard
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Erro ao criar conta.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!userData) {
        return null
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Bem-vindo ao PsyCare</CardTitle>
                    <CardDescription>
                        Olá {userData.fullName}, defina sua senha para acessar sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={userData.email} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? "Criando Conta..." : "Criar Conta e Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
