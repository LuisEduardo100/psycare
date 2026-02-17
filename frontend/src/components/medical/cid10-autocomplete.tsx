"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

interface ICD10Code {
    code: string
    description: string
}

interface CID10AutocompleteProps {
    value: string[]
    onChange: (codes: string[]) => void
    disabled?: boolean
}

// Regex for CID-10 validation: ^[A-Z]\d{2}(\.\d{1,2})?$
const CID10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/

export function CID10Autocomplete({ value, onChange, disabled = false }: CID10AutocompleteProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [options, setOptions] = useState<ICD10Code[]>([])
    const [loading, setLoading] = useState(false)
    const [manualInput, setManualInput] = useState("")
    const [validationError, setValidationError] = useState<string | null>(null)

    // Debounced search
    useEffect(() => {
        if (search.length < 2) {
            setOptions([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await api.get(`/icd10?search=${encodeURIComponent(search)}`)
                setOptions(res.data)
            } catch (error) {
                console.error('Failed to search ICD-10 codes', error)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [search])

    const handleSelect = (code: string) => {
        if (value.includes(code)) {
            // Remove if already selected
            onChange(value.filter((c) => c !== code))
        } else {
            // Add to selection
            onChange([...value, code])
        }
    }

    const handleRemove = (code: string) => {
        onChange(value.filter((c) => c !== code))
    }

    const handleManualAdd = () => {
        const trimmed = manualInput.trim().toUpperCase()

        // Validate regex
        if (!CID10_REGEX.test(trimmed)) {
            setValidationError('Código inválido. Formato esperado: A00 ou A00.0')
            return
        }

        // Check if already added
        if (value.includes(trimmed)) {
            setValidationError('Código já adicionado')
            return
        }

        // Add code
        onChange([...value, trimmed])
        setManualInput('')
        setValidationError(null)
        toast.success(`Código ${trimmed} adicionado`)
    }

    const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase()
        setManualInput(val)

        // Real-time validation
        if (val && !CID10_REGEX.test(val)) {
            setValidationError('Formato inválido (ex: F32.1)')
        } else {
            setValidationError(null)
        }
    }

    return (
        <div className="space-y-3">
            {/* Selected Codes */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((code) => (
                        <Badge key={code} variant="secondary" className="gap-1 pr-1">
                            {code}
                            {!disabled && (
                                <button
                                    onClick={() => handleRemove(code)}
                                    className="ml-1 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {!disabled && (
                <>
                    {/* Search Popover */}
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                            >
                                Buscar CID-10...
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput
                                    placeholder="Digite código ou descrição..."
                                    value={search}
                                    onValueChange={setSearch}
                                />
                                <CommandList>
                                    {loading && (
                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                            Buscando...
                                        </div>
                                    )}
                                    {!loading && search.length >= 2 && options.length === 0 && (
                                        <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
                                    )}
                                    {!loading && options.length > 0 && (
                                        <CommandGroup>
                                            {options.map((option) => (
                                                <CommandItem
                                                    key={option.code}
                                                    value={option.code}
                                                    onSelect={() => {
                                                        handleSelect(option.code)
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            value.includes(option.code) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{option.code}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {option.description}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {/* Manual Input */}
                    <div className="space-y-2">
                        <Label htmlFor="manual-cid" className="text-xs text-muted-foreground">
                            Ou adicione manualmente (formato: A00 ou A00.0)
                        </Label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    id="manual-cid"
                                    value={manualInput}
                                    onChange={handleManualInputChange}
                                    placeholder="Ex: F32.1"
                                    className={cn(
                                        validationError && "border-red-500 focus-visible:ring-red-500"
                                    )}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !validationError && manualInput) {
                                            e.preventDefault()
                                            handleManualAdd()
                                        }
                                    }}
                                />
                                {validationError && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                        <AlertCircle className="h-3 w-3" />
                                        {validationError}
                                    </div>
                                )}
                            </div>
                            <Button
                                onClick={handleManualAdd}
                                disabled={!manualInput || !!validationError}
                                size="sm"
                            >
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {value.length === 0 && disabled && (
                <p className="text-sm text-muted-foreground">Nenhum código CID-10 registrado.</p>
            )}
        </div>
    )
}
