"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import api from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Search, UserPlus, FileText, Calendar, Users } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Patient {
    id: string
    full_name: string
    email: string
    phone: string
    created_at: string
    patient_profile: {
        id: string
        cpf: string
        birth_date: string
        gender: string
        marital_status: string
    }
    hasAvatar: boolean
    lastConsultation: string | null
    activePrescriptionsCount: number
    draftConsultationId?: string | null
}

export default function PatientsPage() {
    const router = useRouter()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            const res = await api.get('/users/patients')
            setPatients(res.data)
        } catch (error) {
            console.error('Failed to fetch patients', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(patient =>
        patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_profile?.cpf?.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleViewProfile = (patientId: string) => {
        router.push(`/dashboard/patients/${patientId}`)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Meus Pacientes</h1>
                    <p className="text-muted-foreground mt-1">Gerencie seus pacientes, prontuários e consultas.</p>
                </div>
                <Button onClick={() => router.push('/dashboard/patients/new')}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Paciente
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle>Listagem de Pacientes</CardTitle>
                            <CardDescription>
                                Você tem um total de {patients.length} pacientes vinculados.
                            </CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, CPF ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Cadastro</TableHead>
                                    <TableHead>Última Consulta</TableHead>
                                    <TableHead>Receitas Ativas</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            Carregando pacientes...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPatients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhum paciente encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <TableRow key={patient.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={`/api/v1/users/${patient.id}/avatar`} />
                                                        <AvatarFallback>{getInitials(patient.full_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900 dark:text-white">
                                                            {patient.full_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Nasc: {patient.patient_profile?.birth_date ? format(new Date(patient.patient_profile.birth_date), 'dd/MM/yyyy') : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {patient.phone || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {format(new Date(patient.created_at), 'dd/MM/yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {patient.lastConsultation ? (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {format(new Date(patient.lastConsultation), "dd MMM yyyy", { locale: ptBR })}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        Nunca consultado
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {patient.activePrescriptionsCount > 0 ? (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
                                                        {patient.activePrescriptionsCount} Ativa(s)
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {patient.draftConsultationId ? (
                                                    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
                                                        Rascunho Pendente
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Ativo
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleViewProfile(patient.patient_profile.id)}>
                                                            <Users className="mr-2 h-4 w-4" /> Ver Perfil
                                                        </DropdownMenuItem>
                                                        {patient.draftConsultationId ? (
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/consultations/${patient.draftConsultationId}`)}>
                                                                <FileText className="mr-2 h-4 w-4 text-amber-600" />
                                                                <span className="text-amber-600">Continuar Consulta</span>
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/consultations/new?patientId=${patient.patient_profile.id}`)}>
                                                                <FileText className="mr-2 h-4 w-4" /> Nova Consulta
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                            Desvincular
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
