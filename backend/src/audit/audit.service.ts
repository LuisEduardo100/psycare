import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(userId: string, action: string, resource: string, ip: string, agent: string, details?: any) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    user_id: userId,
                    action,
                    resource,
                    details: details ? JSON.stringify(details) : undefined,
                    ip_address: ip || 'unknown',
                    user_agent: agent || 'unknown',
                },
            });
        } catch (error) {
            console.error('Failed to create audit log', error);
        }
    }
}
