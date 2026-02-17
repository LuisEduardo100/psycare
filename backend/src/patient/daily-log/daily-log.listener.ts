import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

interface DailyLogCreatedEvent {
    dailyLog: any;
    patientId: string;
}

@Injectable()
export class DailyLogListener {
    private readonly logger = new Logger(DailyLogListener.name);

    constructor(private prisma: PrismaService) { }

    @OnEvent('daily-log.created')
    async handleDailyLogCreated(event: DailyLogCreatedEvent) {
        const { dailyLog, patientId } = event;

        try {
            // RN-001: Sistema Sentinela - Automated Risk Detection
            let shouldCreateAlert = false;
            let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
            let triggerSource = '';

            // Gatilho Secundário: Ideação Suicida (Immediate HIGH alert)
            if (dailyLog.suicidal_ideation_flag === true) {
                shouldCreateAlert = true;
                severity = 'HIGH';
                triggerSource = 'SUICIDAL_IDEATION';
                this.logger.warn(`[SENTINEL] Suicidal ideation detected for patient ${patientId}`);
            }

            // Gatilho Primário: 3-Day Mood Drop (Depression)
            // Check if mood_rating <= 2 for 3 consecutive days
            if (dailyLog.mood_rating !== null && dailyLog.mood_rating <= 2) {
                const lastLogs = await this.prisma.dailyLog.findMany({
                    where: {
                        patient_id: patientId,
                        date: { lt: dailyLog.date },
                        mood_rating: { not: null },
                    },
                    orderBy: { date: 'desc' },
                    take: 2,
                    select: { mood_rating: true, date: true },
                });

                // Check if we have 2 previous logs and all have mood_rating <= 2
                if (lastLogs.length === 2 && lastLogs.every(log => log.mood_rating !== null && log.mood_rating <= 2)) {
                    shouldCreateAlert = true;
                    // If already has suicidal ideation, keep HIGH, otherwise set based on severity
                    if (severity !== 'HIGH') {
                        severity = dailyLog.mood_rating === 1 ? 'HIGH' : 'MEDIUM';
                    }
                    triggerSource = triggerSource
                        ? `${triggerSource}, DEPRESSION_EPISODE`
                        : 'DEPRESSION_EPISODE';
                    this.logger.warn(`[SENTINEL] 3-day mood drop detected for patient ${patientId}`);
                }
            }

            // Create Alert if risk detected
            if (shouldCreateAlert) {
                const alert = await this.prisma.alert.create({
                    data: {
                        patient_id: patientId,
                        severity,
                        trigger_source: triggerSource,
                        status: 'PENDING',
                    },
                });

                this.logger.log(`[SENTINEL] Alert created: ${alert.id} (${severity}) for patient ${patientId}`);

                // Note: SSE events for alerts are handled in the original DailyLogService
                // We don't duplicate that logic here to avoid redundancy
            }
        } catch (error) {
            // Log error but don't throw - we don't want to break the daily log creation
            this.logger.error(`[SENTINEL] Error processing daily log event for patient ${patientId}:`, error);
        }
    }
}
