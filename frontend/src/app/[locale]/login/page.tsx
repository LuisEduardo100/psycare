"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Flower2, Mail, Lock, Eye, EyeOff, Activity } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { IconInput } from "@/components/ui/icon-input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { jwtDecode } from "jwt-decode"

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export default function LoginPage() {
    const router = useRouter()
    const login = useAuthStore((state: any) => state.login)
    const t = useTranslations("Auth")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR">("PATIENT")

    const bgClass = selectedRole === "PATIENT" ? "bg-teal-50 border-teal-100 text-teal-600" : "bg-blue-50 border-blue-100 text-blue-600"

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    // Clear error when form values change
    useEffect(() => {
        const sub = form.watch(() => setError(null))
        return () => sub.unsubscribe()
    }, [form])

    // Also clear error when selectedRole changes
    useEffect(() => {
        setError(null)
    }, [selectedRole])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.post("/auth/login", values)

            if (response.data.requires_2fa) {
                router.push(`/2fa?email=${values.email}`)
                return
            }

            const decoded: any = jwtDecode(response.data.access_token)
            const userRole = (decoded.role || "").toUpperCase()
            const targetRole = selectedRole.toUpperCase()

            console.log("Auth Debug:", { tokenRole: userRole, selectedRole: targetRole })

            if (userRole !== targetRole) {
                let roleName = userRole;
                if (userRole === "DOCTOR") roleName = t("roleDoctor");
                else if (userRole === "PATIENT") roleName = t("rolePatient");
                else if (userRole === "ADMIN") roleName = t("roleAdmin") || "Administrador";

                setError(`${t("roleMismatch")} (Perfil detectado: ${roleName})`)
                setIsLoading(false)
                return
            }

            login(response.data.access_token)

            if (userRole === "DOCTOR") {
                router.push("/dashboard")
            } else {
                router.push("/app")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden transition-all duration-500">
                <div className="px-8 pt-10 pb-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-sm border transition-colors duration-500 ${bgClass}`}>
                            <Activity className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-light text-foreground tracking-tight mb-2">
                            {t("welcomeBack")}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            {t("secureAccess")}
                        </p>
                    </div>

                    {/* Role Toggle */}
                    <SegmentedControl
                        options={[
                            { value: "PATIENT", label: t("rolePatient") },
                            { value: "DOCTOR", label: t("roleDoctor") },
                        ]}
                        value={selectedRole}
                        onChange={setSelectedRole}
                        className="mb-8"
                    />

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                            {t("emailLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <IconInput
                                                icon={<Mail className="h-[18px] w-[18px] text-primary" />}
                                                placeholder={t("emailPlaceholder")}
                                                type="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                            {t("passwordLabel")}
                                        </FormLabel>
                                        <FormControl>
                                            <IconInput
                                                icon={<Lock className="h-[18px] w-[18px] text-primary" />}
                                                rightIcon={
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="hover:text-primary transition-colors"
                                                    >
                                                        {showPassword ? (
                                                            <Eye className="h-[18px] w-[18px]" />
                                                        ) : (
                                                            <EyeOff className="h-[18px] w-[18px]" />
                                                        )}
                                                    </button>
                                                }
                                                placeholder={t("passwordPlaceholder")}
                                                type={showPassword ? "text" : "password"}
                                                {...field}
                                            />
                                        </FormControl>
                                        <div className="flex justify-end pt-1">
                                            <Link
                                                href="/forgot-password"
                                                className="text-xs font-semibold text-primary hover:text-teal-700 transition-colors"
                                            >
                                                {t("forgotPassword")}
                                            </Link>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/30"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t("loading") : t("loginButton")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer */}
                <div className="bg-muted/30 border-t border-border px-8 py-5">
                    <p className="text-center text-sm text-muted-foreground">
                        {t("noAccount") || "Não tem conta?"}{" "}
                        <Link
                            href="/register"
                            className="text-primary font-bold hover:underline ml-1"
                        >
                            {t("signUp") || "Cadastre-se"}
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    )
}
