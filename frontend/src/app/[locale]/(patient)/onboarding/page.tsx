"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "@/i18n/routing"
import { useAuthStore } from "@/store/useAuthStore"
import api from "@/lib/api"
import { parse, isValid } from "date-fns"
import { Flower2, HeartPulse, Shield, ArrowRight, ChevronLeft } from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslations } from "next-intl"

const profileSchema = z.object({
    cpf: z.string().min(11).regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/),
    birthDate: z.string().refine((val) => {
        const date = parse(val, "yyyy-MM-dd", new Date())
        return isValid(date) && date < new Date()
    }),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "UNION"]),
    profession: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
})

export default function OnboardingPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [step, setStep] = useState<1 | 2>(1)
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const t = useTranslations("Onboarding")
    const commonT = useTranslations("Common")

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            cpf: "",
            birthDate: "",
            gender: "MALE",
            maritalStatus: "SINGLE",
            profession: "",
            emergencyContact: "",
            emergencyPhone: "",
        },
    })

    async function onSubmitProfile(values: z.infer<typeof profileSchema>) {
        setIsLoading(true)
        setError(null)
        try {
            await api.post("/users/profile", { ...values, termsAccepted: true })
            router.push("/app")
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.message || commonT("error"))
        } finally {
            setIsLoading(false)
        }
    }

    // Step 1: Welcome + LGPD Consent
    if (step === 1) {
        return (
            <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
                <main className="flex-1 flex flex-col px-6 pt-8 pb-0">
                    <div className="flex justify-center items-center py-6 mb-6">
                        <div className="w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center shadow-sm border border-teal-100">
                            <Flower2 className="h-12 w-12 text-teal-600" />
                        </div>
                    </div>

                    <div className="text-center space-y-3 mb-8">
                        <h1 className="text-3xl font-medium text-foreground leading-tight tracking-tight">
                            {t("welcomeTitle")} <br />
                            <span className="italic text-primary">Psycare</span>
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                            {t("welcomeDesc")}
                        </p>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                            <div className="flex-none w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-teal-600">
                                <HeartPulse className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-base mb-1">
                                    {t("dailyCareTitle")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-snug">
                                    {t("dailyCareDesc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <div className="flex-none w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-blue-500">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground text-base mb-1">
                                    {t("secureTitle")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-snug">
                                    {t("secureDesc")}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                <div className="bg-background border-t border-border px-6 pt-6 pb-8 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="flex items-center h-6">
                            <Checkbox
                                id="terms"
                                checked={termsAccepted}
                                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                className="w-5 h-5"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <label htmlFor="terms" className="font-medium text-foreground cursor-pointer">
                                {t("consentLabel")}
                            </label>
                        </div>
                    </div>

                    <Button
                        onClick={() => setStep(2)}
                        disabled={!termsAccepted}
                        className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 group"
                    >
                        <span>{t("startJourney")}</span>
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </div>
            </div>
        )
    }

    // Step 2: Profile Completion
    return (
        <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
            <header className="px-6 py-4 flex items-center gap-3">
                <button
                    onClick={() => setStep(1)}
                    className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold">{t("completeProfile")}</h1>
            </header>

            <main className="flex-1 px-6 pb-8">
                <p className="text-muted-foreground text-sm mb-6">
                    {t("completeProfileDesc")}
                </p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("cpf")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("cpfPlaceholder")} className="h-12 rounded-xl" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("birthDate")}</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="h-12 rounded-xl" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("gender")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder={commonT("select")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="MALE">{t("genderOptions.male")}</SelectItem>
                                            <SelectItem value="FEMALE">{t("genderOptions.female")}</SelectItem>
                                            <SelectItem value="OTHER">{t("genderOptions.other")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="maritalStatus"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("maritalStatus")}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder={commonT("select")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="SINGLE">{t("maritalOptions.single")}</SelectItem>
                                            <SelectItem value="MARRIED">{t("maritalOptions.married")}</SelectItem>
                                            <SelectItem value="DIVORCED">{t("maritalOptions.divorced")}</SelectItem>
                                            <SelectItem value="WIDOWED">{t("maritalOptions.widowed")}</SelectItem>
                                            <SelectItem value="OTHER">{t("maritalOptions.other")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("emergencyContact")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("emergencyContactPlaceholder")} className="h-12 rounded-xl" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="emergencyPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("emergencyPhone")}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t("emergencyPhonePlaceholder")} className="h-12 rounded-xl" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                            disabled={isLoading}
                        >
                            {isLoading ? commonT("loading") : t("finishProfile")}
                        </Button>
                    </form>
                </Form>
            </main>
        </div>
    )
}
