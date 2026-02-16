import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsentService {
    constructor(private prisma: PrismaService) { }

    async agreeToTerms(patientId: string, termVersion: string, ip: string, agent: string) {
        return this.prisma.consentLog.create({
            data: {
                patient_id: patientId,
                term_version: termVersion,
                ip_address: ip,
                user_agent: agent,
            },
        });
    }

    async revokeConsent(patientId: string) {
        // Logic to revoke latest consent
        // For now, just finding the latest and marking revoked via update or new log?
        // Schema has `revoked_at` on ConsentLog.
        // So we find the active one.
        const lastConsent = await this.prisma.consentLog.findFirst({
            where: { patient_id: patientId, revoked_at: null },
            orderBy: { agreed_at: 'desc' }
        });

        if (lastConsent) {
            return this.prisma.consentLog.update({
                where: { id: lastConsent.id },
                data: { revoked_at: new Date() }
            });
        }
        return null;
    }
}
