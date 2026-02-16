"use client"

import { useEffect, useState } from "react"
import { useRouter } from "@/i18n/routing"
import api from "@/lib/api"
import { MoreHorizontal, Search } from "lucide-react"
import { UserAvatar } from "@/components/shared/user-avatar"

interface Patient {
    id: string
    full_name: string
    email: string
    patient_profile?: {
        id: string
        phone?: string
        cpf?: string
    } | any
}

export function PatientList() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await api.get('/users/patients')
                console.log("Fetched Patients:", response.data)
                setPatients(response.data)
            } catch (error) {
                console.error("Failed to fetch patients", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPatients()
    }, [])

    const filteredPatients = patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando pacientes...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-6 lg:px-8">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar pacientes por nome..."
                        className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-background-light/50 text-xs font-bold uppercase tracking-wider text-[#4c9a93] dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4 text-left lg:px-8">Paciente</th>
                            <th className="hidden px-6 py-4 text-left lg:table-cell">Nível de Risco</th>
                            <th className="hidden px-6 py-4 text-left lg:table-cell">Último Check-in</th>
                            <th className="hidden px-6 py-4 text-left lg:table-cell">Fase da Terapia</th>
                            <th className="px-6 py-4 text-right lg:px-8">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5 dark:divide-slate-700">
                        {filteredPatients.map((patient) => (
                            <tr
                                key={patient.id}
                                className="group cursor-pointer transition-colors hover:bg-primary/5 dark:hover:bg-slate-700/50"
                                onClick={() => {
                                    const targetId = patient.patient_profile?.id || patient.id
                                    router.push(`/dashboard/patients/${targetId}`)
                                }}
                            >
                                <td className="px-6 py-4 lg:px-8">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar
                                            userId={patient.id}
                                            fallbackName={patient.full_name}
                                            hasAvatar={(patient as any).hasAvatar} // Cast for now or update interface
                                            className="h-10 w-10 border border-slate-200"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-[#0d1b1a] dark:text-white">{patient.full_name}</p>
                                            <p className="text-xs text-[#4c9a93]">ID: #{patient.id.slice(0, 4)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden px-6 py-4 lg:table-cell">
                                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                                        Estável
                                    </span>
                                </td>
                                <td className="hidden px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 lg:table-cell">
                                    Ontem
                                </td>
                                <td className="hidden px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 lg:table-cell">
                                    Manutenção
                                </td>
                                <td className="px-6 py-4 text-right lg:px-8">
                                    <button className="text-[#4c9a93] transition-colors hover:text-primary">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                    {searchTerm ? 'Nenhum paciente encontrado com este nome.' : 'Nenhum paciente encontrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
