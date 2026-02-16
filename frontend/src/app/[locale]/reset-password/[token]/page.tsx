"use client"

import { useState, use } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Lock, ArrowRight, Flower2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { toast } from "sonner"
import { useRouter } from "@/i18n/routing"
import AuthLayout from "@/components/auth-layout"

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

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

        setLoading(true)

        try {
            await api.post("/auth/reset-password", { token, password })
            setSuccess(true)
            toast.success("Senha redefinida com sucesso!")
            setTimeout(() => router.push("/login"), 3000)
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Erro ao redefinir senha. O link pode ter expirado.")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <AuthLayout>
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <CheckCircle className="h-10 w-10" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Senha Redefinida!</h2>
                    <p className="text-muted-foreground mb-6">
                        Sua senha foi alterada com sucesso.
                        <br />
                        Você será redirecionado para o login em instantes.
                    </p>
                    <Button asChild className="w-full h-12 rounded-xl" variant="default">
                        <Link href="/login">Ir para Login agora</Link>
                    </Button>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout>
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-500">
                <div className="px-8 pt-10 pb-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-sm border bg-teal-50 border-teal-100 text-teal-600">
                            <Flower2 className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight mb-2">
                            Nova Senha
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Digite sua nova senha abaixo.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Nova Senha
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-12 rounded-xl"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Confirmar Senha
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 h-12 rounded-xl"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl font-semibold shadow-lg shadow-primary/30"
                        >
                            {loading ? "Redefinindo..." : "Redefinir Senha"}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>
        </AuthLayout>
    )
}
