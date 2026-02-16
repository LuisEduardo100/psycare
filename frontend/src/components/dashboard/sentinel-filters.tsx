"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SentinelFiltersProps {
    activeFilter: string
    onFilterChange: (filter: string) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

export function SentinelFilters({
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
}: SentinelFiltersProps) {
    return (
        <div className="space-y-4">
            <Tabs value={activeFilter} onValueChange={onFilterChange}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="ALL">Todos</TabsTrigger>
                    <TabsTrigger value="HIGH" className="text-red-600">Críticos</TabsTrigger>
                    <TabsTrigger value="MEDIUM" className="text-amber-600">Médios</TabsTrigger>
                    <TabsTrigger value="LOW" className="text-yellow-600">Baixos</TabsTrigger>
                </TabsList>
            </Tabs>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-9 h-10 rounded-lg"
                    placeholder="Buscar paciente..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    )
}
