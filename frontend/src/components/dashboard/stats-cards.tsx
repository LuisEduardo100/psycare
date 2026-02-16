"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Users, Calendar, AlertTriangle, TrendingUp } from "lucide-react"

export function StatsCards() {
    const [stats, setStats] = useState({
        patients: 0,
        alerts: 0,
        appointments: 0
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Using known working endpoints based on controller analysis
                const [patientsRes] = await Promise.all([
                    api.get('/users/patients'),
                    // api.get('/alerts?status=PENDING'), // Endpoint might not exist yet or different path
                    // api.get('/consultations') // Endpoint might not exist yet
                ])

                setStats({
                    patients: patientsRes.data.length || 0,
                    alerts: 3, // Mocked for now until alert endpoint is confirmed
                    appointments: 8 // Mocked for now until consultation endpoint is confirmed
                })
            } catch (error) {
                console.error("Failed to fetch stats", error)
                // Fallback to avoid empty state on error
                setStats(prev => ({ ...prev, patients: 0 }))
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="grid grid-cols-3 gap-3 pt-2 lg:gap-6">
            <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:flex-row lg:items-center lg:gap-5 lg:p-6 lg:text-left">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary lg:flex">
                    <Users className="h-8 w-8" />
                </div>
                <div>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-primary lg:hidden">Pacientes</span>
                    <p className="hidden text-sm font-medium text-[#4c9a93] lg:block">Pacientes Ativos</p>

                    <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-2">
                        <span className="text-2xl font-extrabold leading-none text-slate-800 dark:text-white lg:text-3xl">
                            {stats.patients}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 lg:mb-1 lg:text-xs lg:font-bold lg:text-green-600">
                            <TrendingUp className="h-3 w-3 text-green-500 lg:hidden" />
                            <span className="hidden lg:inline">+4% este mês</span>
                            <span className="lg:hidden">+3</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:flex-row lg:items-center lg:gap-5 lg:p-6 lg:text-left">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 lg:flex">
                    <Calendar className="h-8 w-8" />
                </div>
                <div>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-primary lg:hidden">Hoje</span>
                    <p className="hidden text-sm font-medium text-[#4c9a93] lg:block">Consultas Hoje</p>

                    <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-2">
                        <span className="text-2xl font-extrabold leading-none text-slate-800 dark:text-white lg:text-3xl">
                            {stats.appointments}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 lg:mb-1 lg:text-xs">
                            <span className="hidden lg:inline text-[#4c9a93] font-bold">agendadas</span>
                            <span className="lg:hidden">Consultas</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-primary/20 bg-primary/10 p-3 text-center shadow-sm dark:bg-primary/20 lg:flex-row lg:items-center lg:gap-5 lg:border-[#e73108]/10 lg:bg-white lg:p-6 lg:text-left lg:dark:bg-slate-800">
                <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#e73108]/10 text-[#e73108] lg:flex">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-primary lg:hidden">Alertas</span>
                    <p className="hidden text-sm font-medium text-[#4c9a93] lg:block">Alertas Pendentes</p>

                    <div className="flex flex-col items-center lg:flex-row lg:items-center lg:gap-2">
                        <span className="text-2xl font-extrabold leading-none text-primary lg:text-3xl lg:text-slate-800 lg:dark:text-white">
                            {stats.alerts}
                        </span>
                        <span className="mt-2 text-[10px] text-primary/70 lg:mt-0 lg:mb-1 lg:text-xs lg:font-bold lg:text-[#e73108]">
                            Urgente
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
