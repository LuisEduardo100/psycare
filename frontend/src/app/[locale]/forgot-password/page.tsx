"use client"

import { useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, ArrowLeft, Mail, ArrowRight, Flower2 } from "lucide-react"
import { Link } from "@/i18n/routing"
import { toast } from "sonner"
import AuthLayout from "@/components/auth-layout"
import { useTranslations } from "next-intl"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const t = useTranslations("Auth") // Assuming we can use Auth translations or generic

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            await api.post("/auth/forgot-password", { email })
            setSubmitted(true)
            toast.success("Se o email estiver cadastrado, você receberá um link de recuperação.")
        } catch (error) {
            console.error(error)
            toast.error("Erro ao enviar solicitação. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <AuthLayout>
                <div className="bg-card rounded-2xl shadow-xl border border-border p-8 text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                            <Mail className="h-10 w-10" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Verifique seu email</h2>
                    <p className="text-muted-foreground mb-6">
                        Enviamos um link de recuperação para <br /><strong>{email}</strong>.
                    </p>
                    <Button asChild className="w-full h-12 rounded-xl" variant="default">
                        <Link href="/login">Voltar para Login</Link>
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
                            Esqueceu sua senha?
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Não se preocupe, acontece. Enviaremos um link para redefini-la.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                Endereço de Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ola@exemplo.com"
                                    className="pl-10 h-12 rounded-xl"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                            {loading ? "Enviando..." : "Enviar Link"}
                            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-muted/30 border-t border-border px-8 py-5 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para Login
                    </Link>
                </div>
            </div>
        </AuthLayout>
    )
}
