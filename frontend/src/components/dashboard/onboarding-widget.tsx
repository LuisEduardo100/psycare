import { Link } from '@/i18n/routing';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function OnboardingWidget() {
    const { user } = useAuthStore();

    if (!user || user.role !== 'DOCTOR') return null;

    // Calculate Progress
    let progress = 0;
    const missing = [];

    // 1. Basic Info (Always present if registered)
    progress += 20;

    // 2. Professional Info
    if (user.crm && user.uf) {
        progress += 20;
    } else {
        missing.push("Informações Profissionais (CRM/UF)");
    }

    if (user.rqe) {
        progress += 0; // Optional? Or bonus? Let's say it's part of professional
    }

    // 3. Identity
    if (user.cpf) {
        progress += 20;
    } else {
        missing.push("CPF");
    }

    // 4. Address (Clinic)
    if (user.clinic_address) {
        progress += 20;
    } else {
        missing.push("Endereço da Clínica");
    }

    // 5. Security / Validation
    if (user.isTwoFactorAuthenticated) {
        progress += 10;
    } else {
        missing.push("Autenticação de Dois Fatores (2FA)");
    }

    // Certificate
    if (user.certificate_serial) {
        progress += 10;
    } else {
        missing.push("Certificado Digital ICP-Brasil");
    }

    if (progress >= 100) return null; // Hide if complete

    return (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Complete seu Cadastro
                    <span className="ml-auto text-sm font-normal text-blue-700">{progress}% completo</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={progress} className="h-2 mb-4 bg-blue-200" indicatorClassName="bg-blue-600" />

                <div className="space-y-2 mb-4">
                    <p className="text-sm text-blue-800">
                        Para liberar todas as funcionalidades, complete as seguintes etapas:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {missing.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-blue-700/80">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/settings">Ir para Configurações</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
