"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { useState, useMemo, useEffect } from "react"
import api from "@/lib/api"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Smile, HeartPulse, Waves, Zap, Moon, Sun, Pill, ArrowRight, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const formSchema = z.object({
    mood_rating: z.number().min(1).max(5),
    mood_level: z.number().min(-3).max(3),
    anxiety_level: z.number().min(0).max(3).optional(),
    irritability_level: z.number().min(0).max(3).optional(),
    sleep_bedtime: z.string().optional(),
    sleep_onset_time: z.string().optional(),
    sleep_wake_time: z.string().optional(),
    sleep_quality: z.number().min(1).max(5).optional(),
    sleep_difficulty: z.boolean().optional(),
    did_exercise: z.boolean().optional(),
    exercise_types: z.array(z.string()).optional(),
    exercise_other: z.string().optional(),
    adverse_effects: z.array(z.string()).optional(),
    notes: z.string().optional(),
    suicidal_ideation_flag: z.boolean().default(false).optional(),
})

export function DailyLogForm() {
    const t = useTranslations("DailyLog")
    const [loading, setLoading] = useState(false)
    const [showOtherExercise, setShowOtherExercise] = useState(false)

    const moodEmojis = useMemo(() => [
        { value: 1, emoji: "😫", label: t("moodRating.help").split(" - ")[0] },
        { value: 2, emoji: "😕", label: t("moodRating.help").split(" - ")[1] },
        { value: 3, emoji: "😐", label: t("moodRating.help").split(" - ")[2] },
        { value: 4, emoji: "🙂", label: t("moodRating.help").split(" - ")[3] },
        { value: 5, emoji: "🤩", label: t("moodRating.help").split(" - ")[4] },
    ], [t])

    const polarityLabels: Record<number, string> = useMemo(() => ({
        [-3]: "Depressão Grave",
        [-2]: "Depressão Moderada",
        [-1]: "Depressão Leve",
        [0]: "Eutimia (Estável)",
        [1]: "Euforia Leve",
        [2]: "Euforia Moderada",
        [3]: "Mania (Grave)",
    }), [])

    const exerciseOptions = [
        "Corrida", "Caminhada", "Muay Thai", "Pilates", "Boxe",
        "Musculação", "Dança", "Funcional", "Cross-fit"
    ]

    const adverseEffectOptions = useMemo(() => [
        { id: "nausea", label: t("adverseEffects.nausea") },
        { id: "headache", label: t("adverseEffects.headache") },
        { id: "dizziness", label: t("adverseEffects.dizziness") },
        { id: "fatigue", label: t("adverseEffects.fatigue") },
    ], [t])

    const anxietyOptions = useMemo(() => [
        { value: "0", label: t("anxiety.options.0") },
        { value: "1", label: t("anxiety.options.1") },
        { value: "2", label: t("anxiety.options.2") },
        { value: "3", label: t("anxiety.options.3") },
    ], [t])

    const irritabilityOptions = useMemo(() => [
        { value: "0", label: t("irritability.options.0") },
        { value: "1", label: t("irritability.options.1") },
        { value: "2", label: t("irritability.options.2") },
        { value: "3", label: t("irritability.options.3") },
    ], [t])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mood_rating: 3,
            mood_level: 0,
            anxiety_level: 0,
            irritability_level: 0,
            sleep_bedtime: "",
            sleep_onset_time: "",
            sleep_wake_time: "",
            sleep_quality: 3,
            sleep_difficulty: false,
            did_exercise: false,
            exercise_types: [],
            exercise_other: "",
            adverse_effects: [],
            notes: "",
            suicidal_ideation_flag: false,
        },
    })

    // Check for existing log for today
    useEffect(() => {
        const checkTodayLog = async () => {
            try {
                const response = await api.get("/daily-logs/today")
                if (response.data) {
                    const log = response.data

                    form.reset({
                        mood_rating: log.mood_rating || 3,
                        mood_level: log.mood_level || 0,
                        anxiety_level: log.anxiety_level || 0,
                        irritability_level: log.irritability_level || 0,
                        sleep_bedtime: log.sleep_bedtime ? new Date(log.sleep_bedtime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "",
                        sleep_onset_time: log.sleep_onset_time ? new Date(log.sleep_onset_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "",
                        sleep_wake_time: log.sleep_wake_time ? new Date(log.sleep_wake_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "",
                        sleep_quality: log.sleep_quality || 3,
                        sleep_difficulty: log.sleep_difficulty || false,
                        did_exercise: (log.exercise_minutes || 0) > 0,
                        exercise_types: log.exercise_type ? log.exercise_type.split(", ") : [],
                        exercise_other: "",
                        adverse_effects: log.symptoms || [],
                        notes: log.notes || "",
                        suicidal_ideation_flag: log.suicidal_ideation_flag || false,
                    })
                }
            } catch (error) {
                console.error("Error fetching today's log", error)
            }
        }
        checkTodayLog()
    }, [form])

    const sleepBedtime = form.watch("sleep_bedtime")
    const sleepWakeTime = form.watch("sleep_wake_time")
    const moodLevel = form.watch("mood_level")
    const didExercise = form.watch("did_exercise")
    const exerciseTypes = form.watch("exercise_types")

    const sleepDuration = useMemo(() => {
        if (!sleepBedtime || !sleepWakeTime) return null
        const [bH, bM] = sleepBedtime.split(":").map(Number)
        const [wH, wM] = sleepWakeTime.split(":").map(Number)
        let bedMinutes = bH * 60 + bM
        let wakeMinutes = wH * 60 + wM
        if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60
        const diff = wakeMinutes - bedMinutes
        const hours = Math.floor(diff / 60)
        const minutes = diff % 60
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`
    }, [sleepBedtime, sleepWakeTime])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const todayStr = new Date().toISOString().split("T")[0]

            // Format sleep times as ISO strings if provided
            const formatTime = (timeStr?: string) => {
                if (!timeStr) return undefined
                return new Date(`${todayStr}T${timeStr}:00`).toISOString()
            }

            // Calculate hours as number
            let sleep_hours: number | undefined
            if (values.sleep_bedtime && values.sleep_wake_time) {
                const [bH, bM] = values.sleep_bedtime.split(":").map(Number)
                const [wH, wM] = values.sleep_wake_time.split(":").map(Number)
                let diff = (wH * 60 + wM) - (bH * 60 + bM)
                if (diff <= 0) diff += 24 * 60
                sleep_hours = Number((diff / 60).toFixed(1))
            }

            // Process Exercise Type
            let finalExerciseType = undefined
            if (values.did_exercise) {
                const types = [...(values.exercise_types || [])]
                if (values.exercise_other) {
                    types.push(values.exercise_other)
                }
                if (types.length > 0) {
                    finalExerciseType = types.join(", ")
                }
            }

            const { adverse_effects, exercise_types, exercise_other, did_exercise, ...rest } = values

            const payload = {
                date: todayStr,
                ...rest,
                symptoms: adverse_effects,
                sleep_bedtime: formatTime(values.sleep_bedtime),
                sleep_onset_time: formatTime(values.sleep_onset_time),
                sleep_wake_time: formatTime(values.sleep_wake_time),
                sleep_hours,
                exercise_type: finalExerciseType,
                // If exercise is checked but no type selected, we might want to flag it or set a default minutes
                exercise_minutes: values.did_exercise ? 30 : 0, // Defaulting to 30 if checked, or could add field
            }

            await api.post("/daily-logs", payload)
            toast.success(t("success"), {
                description: t("successDescription"),
            })
            form.reset()
        } catch (error: any) {
            console.error("Failed to submit log", error.response?.data || error)
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                toast.error("Erro ao salvar", {
                    description: "Você já enviou um registro diário hoje."
                })
            } else {
                toast.error(t("error"), {
                    description: t("errorDescription"),
                })
            }
        } finally {
            setLoading(false)
        }
    }


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24 md:pb-8 md:grid md:grid-cols-12 md:gap-6 md:space-y-0">
                {/* Mood Rating - Emoji Buttons */}
                <section className="md:col-span-5 bg-card px-5 py-5 rounded-2xl border border-border shadow-sm h-fit">
                    <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Smile className="h-5 w-5 text-primary" />
                        {t("moodRating.label")}
                    </h2>
                    <FormField
                        control={form.control}
                        name="mood_rating"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex justify-between gap-2">
                                    {moodEmojis.map((mood) => (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            onClick={() => field.onChange(mood.value)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-3 rounded-xl border border-border w-full transition-all",
                                                field.value === mood.value
                                                    ? "bg-teal-50 border-primary ring-1 ring-primary scale-105 shadow-sm"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-2xl",
                                                field.value !== mood.value && "grayscale opacity-50"
                                            )}>
                                                {mood.emoji}
                                            </span>
                                            {/* Hide label on small screens if needed, or keep */}
                                            <span className={cn(
                                                "text-[10px] font-medium hidden sm:inline",
                                                field.value === mood.value ? "text-foreground" : "text-muted-foreground"
                                            )}>
                                                {mood.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>

                {/* Mood Level (Slider) */}
                <section className="md:col-span-7 bg-card p-5 rounded-2xl shadow-sm border border-border h-fit">
                    <div className="flex items-center gap-2 mb-4">
                        <HeartPulse className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">{t("moodLevel.label")}</h2>
                    </div>

                    <div className="flex justify-between items-end mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("moodLevel.polarity")}</span>
                        <span className="text-xs font-medium text-primary bg-teal-50 px-3 py-1 rounded border border-teal-100">
                            {moodLevel > 0 ? "+" : ""}{moodLevel} {polarityLabels[moodLevel]}
                        </span>
                    </div>
                    <FormField
                        control={form.control}
                        name="mood_level"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Slider
                                        min={-3}
                                        max={3}
                                        step={1}
                                        value={[field.value ?? 0]}
                                        onValueChange={(vals) => field.onChange(vals[0])}
                                        className="py-4"
                                    />
                                </FormControl>
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                                    <span className="w-20 text-left">{t("moodLevel.depression")}<br />(-3)</span>
                                    <span className="w-20 text-center">{t("moodLevel.euthymia")}<br />(0)</span>
                                    <span className="w-20 text-right">{t("moodLevel.mania")}<br />(+3)</span>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>

                {/* Clinical Scales Row (Anxiety & Irritability) */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Anxiety */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                {t("anxiety.label")}
                            </span>
                            <Waves className="h-[18px] w-[18px] text-primary" />
                        </div>
                        <FormField
                            control={form.control}
                            name="anxiety_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <SegmentedControl
                                            options={anxietyOptions}
                                            value={String(field.value ?? 0)}
                                            onChange={(val) => field.onChange(Number(val))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Irritability */}
                    <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                                {t("irritability.label")}
                            </span>
                            <Zap className="h-[18px] w-[18px] text-primary" />
                        </div>
                        <FormField
                            control={form.control}
                            name="irritability_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <SegmentedControl
                                            options={irritabilityOptions}
                                            value={String(field.value ?? 0)}
                                            onChange={(val) => field.onChange(Number(val))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Sleep Hygiene */}
                <section className="md:col-span-6 bg-card p-5 rounded-2xl shadow-sm border border-border h-fit">
                    <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Moon className="h-5 w-5 text-primary" />
                        {t("sleep.hygiene")}
                    </h2>

                    <div className="space-y-4">
                        {/* Times */}
                        <div className="grid grid-cols-3 gap-2">
                            <FormField
                                control={form.control}
                                name="sleep_bedtime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                            Deitou
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="time"
                                                className="h-9 text-xs rounded-lg bg-muted/50"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sleep_onset_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                            Dormiu
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="time"
                                                className="h-9 text-xs rounded-lg bg-muted/50"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sleep_wake_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                            Acordou
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="time"
                                                className="h-9 text-xs rounded-lg bg-muted/50"
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {sleepDuration && (
                            <div className="text-right">
                                <span className="text-xs text-muted-foreground">
                                    {t("sleep.totalDuration")}: <span className="font-bold text-primary">{sleepDuration}</span>
                                </span>
                            </div>
                        )}

                        <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sleep_quality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold">Qualidade</FormLabel>
                                        <div className="flex gap-1 justify-between">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <div
                                                    key={v}
                                                    onClick={() => field.onChange(v)}
                                                    className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-colors",
                                                        field.value === v ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                    )}
                                                >
                                                    {v}
                                                </div>
                                            ))}
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sleep_difficulty"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end">
                                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => field.onChange(!field.value)}>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                id="sleep_difficulty"
                                            />
                                            <label htmlFor="sleep_difficulty" className="text-xs font-medium cursor-pointer">Teve insônia?</label>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </section>

                {/* Physical Activity & Adverse Effects Column */}
                <div className="md:col-span-6 space-y-6">
                    {/* Physical Activity */}
                    <section className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Atividade Física
                        </h2>
                        <FormField
                            control={form.control}
                            name="did_exercise"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            id="did_exercise"
                                            className="h-5 w-5"
                                        />
                                        <label htmlFor="did_exercise" className="text-sm font-semibold cursor-pointer select-none">
                                            Pratiquei exercícios hoje
                                        </label>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {didExercise && (
                            <div className="space-y-3 animation-fade-in pl-1">
                                <FormField
                                    control={form.control}
                                    name="exercise_types"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex flex-wrap gap-2">
                                                {exerciseOptions.map((option) => (
                                                    <label
                                                        key={option}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all hover:border-primary/50",
                                                            field.value?.includes(option)
                                                                ? "bg-primary/10 border-primary text-primary"
                                                                : "bg-background border-border text-muted-foreground"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            className="hidden"
                                                            checked={field.value?.includes(option)}
                                                            onCheckedChange={(checked) => {
                                                                const current = field.value || []
                                                                if (checked) {
                                                                    field.onChange([...current, option])
                                                                } else {
                                                                    field.onChange(current.filter((v) => v !== option))
                                                                }
                                                            }}
                                                        />
                                                        {option}
                                                    </label>
                                                ))}

                                                <label
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all hover:border-primary/50",
                                                        showOtherExercise
                                                            ? "bg-primary/10 border-primary text-primary"
                                                            : "bg-background border-border text-muted-foreground"
                                                    )}
                                                >
                                                    <Checkbox
                                                        className="hidden"
                                                        checked={showOtherExercise}
                                                        onCheckedChange={(checked) => {
                                                            setShowOtherExercise(!!checked)
                                                            if (!checked) {
                                                                form.setValue("exercise_other", "")
                                                            }
                                                        }}
                                                    />
                                                    Outro
                                                </label>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {showOtherExercise && (
                                    <FormField
                                        control={form.control}
                                        name="exercise_other"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Qual outro exercício?"
                                                        className="h-9 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>
                        )}
                    </section>

                    {/* Adverse Effects */}
                    <section className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <Pill className="h-5 w-5 text-primary" />
                            {t("adverseEffects.label")}
                        </h2>
                        <FormField
                            control={form.control}
                            name="adverse_effects"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="grid grid-cols-2 gap-2">
                                        {adverseEffectOptions.map((effect) => (
                                            <label
                                                key={effect.id}
                                                className={cn(
                                                    "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                                                    field.value?.includes(effect.id)
                                                        ? "bg-primary/5 border-primary/30"
                                                        : "bg-card border-border hover:bg-muted/50"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={field.value?.includes(effect.id)}
                                                    onCheckedChange={(checked) => {
                                                        const current = field.value || []
                                                        if (checked) {
                                                            field.onChange([...current, effect.id])
                                                        } else {
                                                            field.onChange(current.filter((v) => v !== effect.id))
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="ml-2 text-xs font-medium text-foreground">
                                                    {effect.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </section>
                </div>

                {/* Therapeutic Notes */}
                <section className="md:col-span-12">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden focus-within:ring-2 ring-primary/20 transition-all">
                                    <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                                        <h2 className="text-sm font-bold text-foreground">
                                            {t("notes")}
                                        </h2>
                                    </div>
                                    <FormControl>
                                        <Textarea
                                            className="w-full text-base md:text-sm p-4 min-h-[120px] resize-none border-none focus-visible:ring-0 bg-transparent"
                                            placeholder={t("notesPlaceholder")}
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <div className="px-4 py-2 bg-muted/20 border-t border-border flex justify-end">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                            {t("notesVisibility")}
                                        </span>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>

                {/* Submit */}
                <div className="md:col-span-12 flex justify-end pt-4">
                    <Button
                        type="submit"
                        className="w-full md:w-auto md:px-8 h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        disabled={loading}
                    >
                        {loading ? t("loading") : t("submitConfig")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
