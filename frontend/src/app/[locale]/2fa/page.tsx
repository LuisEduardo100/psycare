"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { useTranslations } from "next-intl"
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
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
    token: z.string().min(6).max(6),
})

function TwoFactorForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email')
    const login = useAuthStore((state: any) => state.login)
    const t = useTranslations("Auth")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            token: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.post("/auth/2fa/authenticate", { token: values.token })
            login(response.data.access_token)
            router.push("/dashboard")
        } catch (err: any) {
            setError(err.response?.data?.message || t("invalidCode"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("twoFactorTitle")}</CardTitle>
                <CardDescription>
                    {t("twoFactorDescription", { email: email ?? "" })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="token"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>{t("twoFactorCode")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456" maxLength={6} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t("verifying") : t("verify")}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function TwoFactorPage() {
    const t = useTranslations("Common")
    return (
        <AuthLayout>
            <Suspense fallback={<div>{t("loading")}</div>}>
                <TwoFactorForm />
            </Suspense>
        </AuthLayout>
    )
}
