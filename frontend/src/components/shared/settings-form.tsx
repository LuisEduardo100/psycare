"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserAvatar } from "./user-avatar"
import { useAuthStore } from "@/store/useAuthStore"
import { LogOut, Upload, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { toast } from "sonner"
import { formatPhone, formatCPF } from "@/lib/masks"
import { OtpModal } from "./otp-modal"

const passwordSchema = z.object({
    old_password: z.string().min(1, "Obrigatório"),
    new_password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm_password: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Senhas não conferem",
    path: ["confirm_password"],
})

const profileSchema = z.object({
    full_name: z.string().min(3, "Mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    cpf: z.string().optional(),
    crm: z.string().optional(),
    uf: z.string().optional(),
    rqe: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
})

export function SettingsForm() {
    const { user, logout, updateUser, refreshAvatar } = useAuthStore()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [otpOpen, setOtpOpen] = useState(false)
    const [phoneVerified, setPhoneVerified] = useState(false) // In real app, check user.isPhoneVerified

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            old_password: "",
            new_password: "",
            confirm_password: "",
        },
    })

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: user?.fullName || "",
            email: user?.email || "",
            phone: user?.phone || "",
            cpf: user?.cpf || "",
            crm: (user as any)?.crm || "",
            uf: (user as any)?.uf || "",
            rqe: (user as any)?.rqe || "",
            street: (user as any)?.street || "",
            number: (user as any)?.number || "",
            complement: (user as any)?.complement || "",
            neighborhood: (user as any)?.neighborhood || "",
            city: (user as any)?.city || "",
            state: (user as any)?.state || "",
            zip_code: (user as any)?.zip_code || "",
        },
    })

    useEffect(() => {
        if (user) {
            profileForm.reset({
                full_name: user.fullName || "",
                email: user.email || "",
                phone: user.phone || "",
                cpf: user.cpf || "",
                crm: (user as any).crm || "",
                uf: (user as any).uf || "",
                rqe: (user as any).rqe || "",
                street: (user as any).street || ((user as any).clinic_address?.street) || "",
                number: (user as any).number || ((user as any).clinic_address?.number) || "",
                complement: (user as any).complement || ((user as any).clinic_address?.complement) || "",
                neighborhood: (user as any).neighborhood || ((user as any).clinic_address?.neighborhood) || "",
                city: (user as any).city || ((user as any).clinic_address?.city) || "",
                state: (user as any).state || ((user as any).clinic_address?.state) || "",
                zip_code: (user as any).zip_code || ((user as any).clinic_address?.zip_code) || "",
            })
            setPreviewUrl(null)
        }
    }, [user, profileForm])

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        setLoading(true)
        try {
            // Check for email change
            if (values.email !== user?.email) {
                try {
                    await api.post('/auth/email/request-change', { newEmail: values.email });
                    toast.info(`Link de confirmação enviado para ${values.email}. Verifique sua caixa de entrada.`);
                } catch (emailError: any) {
                    toast.error(emailError.response?.data?.message || "Erro ao solicitar alteração de email.");
                    // Don't halt other updates, or halt? Maybe halt to user understands.
                    // But if fetching avatar worked... let's continue but warn.
                }
            }

            // 1. Upload Avatar if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                await api.post('/users/me/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Update Text Data
            const payload: any = {
                full_name: values.full_name,
                phone: values.phone,
                cpf: values.cpf,
                // Combine address into flat fields for User model update
                street: values.street,
                number: values.number,
                complement: values.complement,
                neighborhood: values.neighborhood,
                city: values.city,
                state: values.state,
                zip_code: values.zip_code,
            }

            // Only send doctor fields if doctor
            if (user?.role === 'DOCTOR') {
                payload.crm = values.crm;
                payload.uf = values.uf;
                payload.rqe = values.rqe;
                payload.clinic_address = {
                    street: values.street,
                    number: values.number,
                    complement: values.complement,
                    neighborhood: values.neighborhood,
                    city: values.city,
                    state: values.state,
                    zip_code: values.zip_code
                }
            }

            await api.patch('/users/me', payload)

            if (updateUser) {
                updateUser({
                    fullName: values.full_name,
                    phone: values.phone,
                    cpf: values.cpf,
                    // Don't update email locally until confirmed
                } as any)
            }
            refreshAvatar()
            toast.success("Perfil atualizado com sucesso!")
        } catch (error: any) {
            console.error("Erro ao atualizar perfil", error)
            toast.error("Erro ao atualizar perfil.")
        } finally {
            setLoading(false)
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setLoading(true)
        try {
            await api.patch('/users/password', {
                old_password: values.old_password,
                new_password: values.new_password
            })
            toast.success("Senha alterada com sucesso!")
            passwordForm.reset()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao alterar senha.")
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    return (
        <div className="space-y-8">
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">

                    {/* SECTION 1: PERSONAL INFO */}
                    <Card id="personal-info">
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Dados básicos da sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                {/* Avatar */}
                                <div className="flex flex-col items-center gap-3">
                                    <UserAvatar
                                        userId={user?.userId}
                                        src={previewUrl || undefined}
                                        fallbackName={user?.fullName}
                                        hasAvatar={user?.hasAvatar}
                                        className="h-24 w-24 border-2 border-muted"
                                    />
                                    <label htmlFor="picture-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline">
                                        Alterar Foto
                                        <input id="picture-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>

                                {/* Fields */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <FormField
                                        control={profileForm.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome Completo</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={profileForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormDescription>
                                                    Mudar o email exige confirmação.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={profileForm.control}
                                        name="cpf"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CPF</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="000.000.000-00"
                                                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                                                        maxLength={14}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={profileForm.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>Celular</FormLabel>
                                                    {!phoneVerified && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOtpOpen(true)}
                                                            className="text-xs text-amber-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <AlertTriangle className="h-3 w-3" /> Verificar
                                                        </button>
                                                    )}
                                                    {phoneVerified && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <CheckCircle2 className="h-3 w-3" /> Verificado
                                                        </span>
                                                    )}
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="(00) 00000-0000"
                                                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                                        maxLength={15}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: PROFESSIONAL INFO (DOCTOR ONLY) */}
                    {user?.role === 'DOCTOR' && (
                        <Card id="professional-info">
                            <CardHeader>
                                <CardTitle>Informações Profissionais</CardTitle>
                                <CardDescription>Dados do seu registro médico.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={profileForm.control}
                                    name="crm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CRM</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="uf"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UF</FormLabel>
                                            <FormControl><Input {...field} maxLength={2} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="rqe"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RQE</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* SECTION 3: ADDRESS */}
                    <Card id="address-info">
                        <CardHeader>
                            <CardTitle>Endereço {user?.role === 'DOCTOR' ? 'da Clínica' : ''}</CardTitle>
                            <CardDescription>Localização para correspondência ou atendimento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={profileForm.control}
                                    name="zip_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CEP</FormLabel>
                                            <FormControl><Input {...field} placeholder="00000-000" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="street"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Rua</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={profileForm.control}
                                    name="number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="complement"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={profileForm.control}
                                    name="neighborhood"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bairro</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cidade</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={profileForm.control}
                                    name="state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <FormControl><Input {...field} maxLength={2} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} size="lg" className="shadow-lg">
                            {loading ? "Salvando..." : "Salvar Todas as Alterações"}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* SECTION 4: SECURITY */}
            <Card id="security" className="border-red-100 bg-red-50/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Segurança
                    </CardTitle>
                    <CardDescription>Gerencie sua senha e acesso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="old_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha Atual</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="new_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nova Senha</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirm_password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar Nova Senha</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button type="submit" variant="outline" disabled={loading}>
                                    Alterar Senha
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <OtpModal
                open={otpOpen}
                onOpenChange={setOtpOpen}
                phone={profileForm.getValues("phone") || ""}
                onVerified={() => setPhoneVerified(true)}
            />
        </div>
    )
}
