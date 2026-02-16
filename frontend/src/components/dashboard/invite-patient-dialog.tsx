'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface InvitePatientDialogProps {
    trigger?: React.ReactNode
}

export function InvitePatientDialog({ trigger }: InvitePatientDialogProps) {
    const t = useTranslations('Dashboard')
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [fullName, setFullName] = useState('')

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await api.post('/users/patients/invite', { email, fullName })

            // In dev mode or without email service, we get the token back
            if (response.data && response.data.inviteToken) {
                const link = `${window.location.origin}/accept-invitation/${response.data.inviteToken}`
                setInviteLink(link)
                toast.success(t('inviteSuccess'))
            } else {
                toast.success(t('inviteSuccessEmail'))
                setOpen(false)
                setEmail('')
                setFullName('')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('inviteError'))
        } finally {
            setLoading(false)
        }
    }

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
            toast.success(t('linkCopied'))
        }
    }

    const resetForm = () => {
        setOpen(false)
        setInviteLink(null)
        setEmail('')
        setFullName('')
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm()
            else setOpen(true)
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2 w-full h-[42px] rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold shadow-sm">
                        <UserPlus className="h-5 w-5" />
                        {t('invitePatient')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {!inviteLink ? (
                    <form onSubmit={handleInvite}>
                        <DialogHeader>
                            <DialogTitle>{t('invitePatient')}</DialogTitle>
                            <DialogDescription>
                                {t('inviteDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('name')}</Label>
                                <Input
                                    id="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nome completo do paciente"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={resetForm}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{t('inviteCreated')}</DialogTitle>
                            <DialogDescription>
                                {t('inviteCreatedDesc')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-4 bg-muted rounded-md break-all text-sm font-mono border">
                            {inviteLink}
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={copyLink} className="w-full sm:w-auto">
                                {t('copyLink')}
                            </Button>
                            <Button onClick={resetForm} className="w-full sm:w-auto">
                                {t('close')}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
