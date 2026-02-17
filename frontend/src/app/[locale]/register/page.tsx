"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { Flower2, User, Mail, Lock, Eye, EyeOff, Link2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { formatCPF, formatPhone } from "@/lib/masks"

const formSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    invitationCode: z.string().optional(),
    crm: z.string().optional(),
    uf: z.string().optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    rqe: z.string().optional(),
})

export default function RegisterPage() {
    const router = useRouter()
    const login = useAuthStore((state: any) => state.login)
    const t = useTranslations("Auth")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [selectedRole, setSelectedRole] = useState<"PATIENT" | "DOCTOR">("PATIENT")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            invitationCode: "",
            crm: "",
            uf: "",
            cpf: "",
            phone: "",
            rqe: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const payload = {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: selectedRole,
                crm: values.crm,
                uf: values.uf,
                cpf: values.cpf,
                phone: values.phone,
                rqe: values.rqe,
                ...(values.invitationCode ? { invitationCode: values.invitationCode } : {}),
            }
            const response = await api.post("/auth/register", payload)
            login(response.data.access_token)
            if (selectedRole === "DOCTOR") {
                router.push("/dashboard")
            } else {
                router.push("/onboarding")
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
                <div className="px-8 pt-10 pb-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 mb-5 text-teal-600 shadow-sm border border-teal-100">
                            <Flower2 className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            {t("registerTitle")}
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {t("registerSubtitle")}
                        </p>
                    </div>

                    {/* Role Switch */}
                    <div className="mb-6">
                        <SegmentedControl
                            options={[
                                { value: "PATIENT", label: t("rolePatient") || "Paciente" },
                                { value: "DOCTOR", label: t("roleDoctor") || "Médico" },
                            ]}
                            value={selectedRole}
                            onChange={setSelectedRole}
                        />
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                            {t("fullName")}
                                        </FormLabel>
                                        <FormControl>
                                            <IconInput
                                                icon={<User className="h-[18px] w-[18px] text-primary" />}
                                                placeholder={t("fullNamePlaceholder")}
                                                type="text"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                            Celular
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="(00) 00000-0000"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(formatPhone(e.target.value))
                                                }}
                                                maxLength={15}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedRole === "DOCTOR" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="crm"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                                        CRM
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="000000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="uf"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                                        UF
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="SP" maxLength={2} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="cpf"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                                        CPF
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="000.000.000-00"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(formatCPF(e.target.value))
                                                            }}
                                                            maxLength={14}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="rqe"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                                                    RQE (Opcional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Registro de Especialista" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

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
                                    {isLoading ? t("loadingRegister") : t("registerButton")}
                                </Button>
                            </div>

                            <p className="text-center text-xs text-muted-foreground mt-4">
                                {t("termsText")}{" "}
                                <Link href="#" className="text-primary hover:underline">
                                    {t("termsLink")}
                                </Link>{" "}
                                e{" "}
                                <Link href="#" className="text-primary hover:underline">
                                    {t("privacyLink")}
                                </Link>
                                .
                            </p>
                        </form>
                    </Form>
                </div>

                {/* Footer */}
                <div className="bg-muted/30 border-t border-border px-8 py-5">
                    <p className="text-center text-sm text-muted-foreground">
                        {t("hasAccount") || "Já tem conta?"}{" "}
                        <Link
                            href="/login"
                            className="text-primary font-bold hover:underline ml-1"
                        >
                            {t("signIn") || "Entrar"}
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    )
}
