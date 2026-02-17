"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface OtpModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onVerified: () => void
    phone: string
}

export function OtpModal({ open, onOpenChange, onVerified, phone }: OtpModalProps) {
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"SEND" | "VERIFY">("SEND")

    const handleSendOtp = async () => {
        setLoading(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            console.log(`[OTP-MOCK] Sending OTP to ${phone}`)
            toast.success("Código enviado para seu telefone (Simulado)")
            setStep("VERIFY")
        } catch (error) {
            toast.error("Erro ao enviar código")
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setLoading(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (otp === "123456") {
                toast.success("Telefone verificado com sucesso!")
                onVerified()
                onOpenChange(false)
            } else {
                toast.error("Código inválido (Dica: use 123456)")
            }
        } catch (error) {
            toast.error("Erro ao verificar código")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verificar Telefone</DialogTitle>
                    <DialogDescription>
                        {step === "SEND"
                            ? `Enviaremos um código SMS para ${phone}`
                            : `Digite o código enviado para ${phone}`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {step === "SEND" ? (
                        <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                            {loading ? "Enviando..." : "Enviar Código"}
                        </Button>
                    ) : (
                        <div className="space-y-4">
                            <Input
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="text-center text-2xl tracking-widest"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep("SEND")} className="flex-1">
                                    Reenviar
                                </Button>
                                <Button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} className="flex-1">
                                    {loading ? "Verificando..." : "Confirmar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
