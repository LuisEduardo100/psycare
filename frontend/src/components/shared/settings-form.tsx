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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "./user-avatar"
import { useAuthStore } from "@/store/useAuthStore"
import { LogOut, Upload } from "lucide-react"
import { useRouter } from "@/i18n/routing"
import { toast } from "sonner"

const passwordSchema = z.object({
    old_password: z.string().min(1, "Obrigatório"),
    new_password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm_password: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Senhas não conferem",
    path: ["confirm_password"],
})

// Utility for phone masking
const formatPhone = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    value = value.substring(0, 11)
    if (value.length > 10) {
        return value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
    } else if (value.length > 5) {
        return value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    } else if (value.length > 2) {
        return value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2")
    } else {
        return value.replace(/^(\d*)/, "($1")
    }
}

const profileSchema = z.object({
    full_name: z.string().min(3, "Mínimo 3 caracteres"),
    phone: z.string().optional(),
    profile_picture: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
})

export function SettingsForm() {
    const t = useTranslations("Settings")
    const { user, login, logout, updateUser, refreshAvatar } = useAuthStore()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
            phone: user?.phone || "",
            profile_picture: user?.profilePicture || "",
            street: (user as any)?.street || "",
            number: (user as any)?.number || "",
            complement: (user as any)?.complement || "",
            neighborhood: (user as any)?.neighborhood || "",
            city: (user as any)?.city || "",
            state: (user as any)?.state || "",
            zip_code: (user as any)?.zip_code || "",
        },
    })

    // Update form when user data changes (including new fields)
    useEffect(() => {
        if (user) {
            profileForm.reset({
                full_name: user.fullName,
                phone: user.phone || "",
                profile_picture: user.profilePicture || "",
                street: (user as any).street || "",
                number: (user as any).number || "",
                complement: (user as any).complement || "",
                neighborhood: (user as any).neighborhood || "",
                city: (user as any).city || "",
                state: (user as any).state || "",
                zip_code: (user as any).zip_code || "",
            })
            setPreviewUrl(null)
        }
    }, [user, profileForm])

    // ... (onPasswordSubmit)

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        setLoading(true)
        try {
            // 1. Upload Avatar if selected
            let avatarFilename = values.profile_picture;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);

                try {
                    const uploadRes = await api.post('/users/me/avatar', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.filename) {
                        avatarFilename = uploadRes.data.filename;
                    }
                } catch (uploadError) {
                    console.error("Upload failed", uploadError);
                    toast.error("Erro ao enviar foto via upload. Tentando salvar dados de texto.");
                }
            }

            // 2. Update Text Data
            await api.patch('/users/me', {
                full_name: values.full_name,
                phone: values.phone,
                street: values.street,
                number: values.number,
                complement: values.complement,
                neighborhood: values.neighborhood,
                city: values.city,
                state: values.state,
                zip_code: values.zip_code,
            })

            // Update local user store
            if (updateUser) {
                updateUser({
                    fullName: values.full_name,
                    phone: values.phone,
                    // We need to update user interface in store to hold these generic fields or just cast
                    // ideally update the User interface in store
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
            console.error("Erro ao alterar senha", error)
            toast.error(error.response?.data?.message || "Erro ao alterar senha.")
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file);
            // Create preview
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
        }
    }

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    // ... (handleFileChange, handleLogout)

    return (
        <div className="space-y-8">
            <Tabs defaultValue="profile" className="w-full">
                {/* ... TabsList ... */}

                <TabsContent value="profile" className="space-y-6 pt-4">
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">

                            <div className="flex flex-col items-center gap-4 mb-6">
                                <UserAvatar
                                    userId={user?.userId}
                                    src={previewUrl || undefined}
                                    fallbackName={user?.fullName}
                                    hasAvatar={user?.hasAvatar}
                                    className="h-32 w-32 border-4 border-background shadow-xl"
                                />
                                <div className="flex items-center gap-2">
                                    <label htmlFor="picture-upload" className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium">
                                            <Upload className="h-4 w-4" />
                                            Alterar Foto
                                        </div>
                                        <input
                                            id="picture-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                {previewUrl && (
                                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                                        Clique em "Salvar Alterações" para confirmar a nova foto
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={profileForm.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                            <FormLabel>Telefone</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="(00) 00000-0000"
                                                    onChange={(e) => {
                                                        const formatted = formatPhone(e.target.value)
                                                        field.onChange(formatted)
                                                    }}
                                                    value={field.value}
                                                    maxLength={15}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-medium mb-4">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="zip_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>CEP</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="00000-000" />
                                                </FormControl>
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
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
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
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="neighborhood"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bairro</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
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
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
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
                                                <FormControl>
                                                    <Input {...field} maxLength={2} placeholder="UF" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full md:w-auto">
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 pt-4">
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                                control={passwordForm.control}
                                name="old_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Senha Atual</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Alterar Senha"}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </div>
    )
}
