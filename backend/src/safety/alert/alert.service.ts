import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

// Valid Sentinela workflow transitions
const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
    'PENDING': ['VIEWED'],
    'VIEWED': ['CONTACTED'],
    'CONTACTED': ['RESOLVED', 'FALSE_POSITIVE'],
};

@Injectable()
export class AlertService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async findAll(filters?: { status?: string, severity?: string, doctorId?: string }) {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.severity) where.severity = filters.severity;
        if (filters?.doctorId) {
            where.patient = {
                doctor_id: filters.doctorId
            };
        }

        return this.prisma.alert.findMany({
            where,
            include: { patient: { include: { user: { select: { full_name: true } } } } },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string) {
        const alert = await this.prisma.alert.findUnique({
            where: { id },
            include: {
                patient: {
                    include: {
                        user: { select: { full_name: true, email: true, phone: true } },
                    },
                },
            },
        });
        if (!alert) throw new NotFoundException('Alert not found');
        return alert;
    }

    async findByPatientId(patientId: string) {
        return this.prisma.alert.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' },
        });
    }

    async getStats(doctorId: string) {
        const alerts = await this.prisma.alert.findMany({
            where: {
                patient: { doctor_id: doctorId },
            },
            select: { severity: true, status: true, created_at: true },
        });

        const now = new Date();
        const pendingAlerts = alerts.filter(a => a.status === 'PENDING');
        const slaBreached = pendingAlerts.filter(a => {
            const diff = now.getTime() - new Date(a.created_at).getTime();
            return diff > 24 * 60 * 60 * 1000; // > 24 hours
        });

        return {
            total: alerts.length,
            pending: pendingAlerts.length,
            highPending: pendingAlerts.filter(a => a.severity === 'HIGH').length,
            mediumPending: pendingAlerts.filter(a => a.severity === 'MEDIUM').length,
            viewed: alerts.filter(a => a.status === 'VIEWED').length,
            contacted: alerts.filter(a => a.status === 'CONTACTED').length,
            resolved: alerts.filter(a => a.status === 'RESOLVED').length,
            falsPositive: alerts.filter(a => a.status === 'FALSE_POSITIVE').length,
            slaBreached: slaBreached.length,
        };
    }

    async updateStatus(id: string, status: string, notes?: string, contactMethod?: string) {
        const alert = await this.prisma.alert.findUnique({ where: { id } });
        if (!alert) throw new NotFoundException('Alert not found');

        // Validate workflow transition
        const allowed = WORKFLOW_TRANSITIONS[alert.status];
        if (!allowed || !allowed.includes(status)) {
            throw new BadRequestException(
                `Invalid transition: ${alert.status} → ${status}. Allowed: ${allowed?.join(', ') || 'none'}`
            );
        }

        const updated = await this.prisma.alert.update({
            where: { id },
            data: {
                status,
                resolution_notes: notes,
                contact_method: contactMethod,
            },
        });

        // Emit SSE event for alert update
        const patientData = await this.prisma.patientProfile.findUnique({
            where: { id: alert.patient_id },
            select: { doctor_id: true },
        });
        if (patientData?.doctor_id) {
            this.eventEmitter.emit('sse.event', {
                doctorId: patientData.doctor_id,
                type: 'alert_updated',
                data: { alertId: id, newStatus: status },
            });
        }

        return updated;
    }
}
