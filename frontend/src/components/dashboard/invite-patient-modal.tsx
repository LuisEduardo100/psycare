
import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Search, Link as LinkIcon, Check } from "lucide-react"
import { UserAvatar } from "@/components/shared/user-avatar"

// Inline debounce hook if not exists (checked imports, but safe to assume standard utils or reimplement simple one)
function useDebounceVal<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debouncedValue
}

interface SearchResult {
    id: string
    full_name: string
    email: string
    profile_picture?: string
    patient_profile?: {
        doctor_id: string | null
    }
}

export function InvitePatientModal() {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const debouncedSearch = useDebounceVal(search, 500)

    useEffect(() => {
        async function fetchPatients() {
            if (debouncedSearch.length < 3) {
                setResults([])
                return
            }
            setLoading(true)
            try {
                const res = await api.get(`/users/search?q=${debouncedSearch}`)
                setResults(res.data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchPatients()
    }, [debouncedSearch])

    async function handleLink(patientId: string) {
        try {
            await api.post("/users/patients/link", { patientId })
            toast.success("Paciente vinculado com sucesso!")
            setOpen(false)
            setSearch("")
            // Ideally trigger refresh of patient list
            window.location.reload() // Simple refresh for now
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erro ao vincular paciente.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Buscar Paciente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Buscar Paciente</DialogTitle>
                    <DialogDescription>
                        Busque por nome ou email para vincular um paciente existente.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="space-y-2 min-h-[200px]">
                        {loading && <p className="text-sm text-center text-muted-foreground">Buscando...</p>}

                        {!loading && results.length === 0 && search.length >= 3 && (
                            <p className="text-sm text-center text-muted-foreground">Nenhum paciente encontrado.</p>
                        )}

                        {!loading && results.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        userId={user.id}
                                        className="h-10 w-10"
                                        fallbackName={user.full_name}
                                        hasAvatar={!!user.profile_picture}
                                    />
                                    <div>
                                        <p className="font-medium">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant={user.patient_profile?.doctor_id ? "secondary" : "default"}
                                    disabled={!!user.patient_profile?.doctor_id}
                                    onClick={() => handleLink(user.id)}
                                >
                                    {user.patient_profile?.doctor_id ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Vinculado
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            Vincular
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
