import { Injectable, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';

@Injectable()
export class DailyLogService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(userId: string, dto: CreateDailyLogDto) {
        // Get patient profile linked to the user
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
            select: { id: true },
        });

        if (!patientProfile) {
            throw new BadRequestException('Patient profile not found for this user');
        }

        // Check if log already exists for this date
        const logDate = new Date(dto.date);
        const existingLog = await this.prisma.dailyLog.findUnique({
            where: {
                patient_id_date: {
                    patient_id: patientProfile.id,
                    date: logDate,
                },
            },
        });

        if (existingLog) {
            throw new BadRequestException('Daily log for this date already exists');
        }

        // Risk Analysis Logic (Sentinela)
        let riskFlag = false;
        let triggerSource = '';

        // Gatilho Secundário: Ideação Suicida
        if (dto.suicidal_ideation_flag) {
            riskFlag = true;
            triggerSource = 'SUICIDAL_IDEATION';
        }

        // Gatilho Primário: Drop de Humor (Depressão ou Mania severa por 3 dias)
        // LCM: mood_level <= -2 (Depressão Moderada/Grave) ou >= 2 (Mania Moderada/Grave)
        // Simplificação: Se mood_level <= -2 (Depressão)
        if (dto.mood_level !== undefined && dto.mood_level <= -2) {
            const lastLogs = await this.prisma.dailyLog.findMany({
                where: {
                    patient_id: patientProfile.id,
                    date: { lt: logDate },
                    mood_level: { not: null }
                },
                orderBy: { date: 'desc' },
                take: 2,
            });

            if (lastLogs.length === 2 && lastLogs.every(log => log.mood_level !== null && log.mood_level <= -2)) {
                riskFlag = true;
                triggerSource = triggerSource ? `${triggerSource}, DEPRESSION_EPISODE` : 'DEPRESSION_EPISODE';
            }
        }
        // Check for Mania? (Optional for now, focusing on safety/suicide risks usually linked to depression/mixed)

        // Create the DailyLog
        const log = await this.prisma.dailyLog.create({
            data: {
                patient_id: patientProfile.id,
                date: logDate,
                sleep_bedtime: dto.sleep_bedtime ? new Date(dto.sleep_bedtime) : null,
                sleep_onset_time: dto.sleep_onset_time ? new Date(dto.sleep_onset_time) : null,
                sleep_wake_time: dto.sleep_wake_time ? new Date(dto.sleep_wake_time) : null,
                sleep_quality: dto.sleep_quality,
                sleep_awakenings: dto.sleep_awakenings,
                sleep_difficulty: dto.sleep_difficulty,
                sleep_hours: dto.sleep_hours, // New

                mood_rating: dto.mood_rating, // New
                mood_level: dto.mood_level, // New
                anxiety_level: dto.anxiety_level, // New
                irritability_level: dto.irritability_level, // New

                mood_tags: dto.mood_tags || [],
                symptoms: dto.symptoms || [],
                notes: dto.notes,
                suicidal_ideation_flag: dto.suicidal_ideation_flag || false,
                risk_flag: riskFlag,

                exercise_minutes: dto.exercise_minutes,
                exercise_type: dto.exercise_type,
                exercise_intensity: dto.exercise_intensity,

                menstruation_stage: dto.menstruation_stage, // New
                life_event_description: dto.life_event_description, // New
                life_event_impact: dto.life_event_impact, // New
            },
        });

        // If risk detected, create Alert
        if (riskFlag) {
            const alert = await this.prisma.alert.create({
                data: {
                    patient_id: patientProfile.id,
                    severity: 'HIGH',
                    trigger_source: triggerSource,
                    status: 'PENDING',
                },
            });

            // Emit SSE event for new alert
            const patientWithDoctor = await this.prisma.patientProfile.findUnique({
                where: { id: patientProfile.id },
                select: { doctor_id: true, user: { select: { full_name: true } } },
            });
            if (patientWithDoctor?.doctor_id) {
                this.eventEmitter.emit('sse.event', {
                    doctorId: patientWithDoctor.doctor_id,
                    type: 'new_alert',
                    data: {
                        alertId: alert.id,
                        patientName: patientWithDoctor.user.full_name,
                        severity: 'HIGH',
                        triggerSource: triggerSource,
                    },
                });
            }
        }

        // Emit SSE event for new daily log to linked doctor
        const patientInfo = await this.prisma.patientProfile.findUnique({
            where: { id: patientProfile.id },
            select: { doctor_id: true, user: { select: { full_name: true } } },
        });
        if (patientInfo?.doctor_id) {
            this.eventEmitter.emit('sse.event', {
                doctorId: patientInfo.doctor_id,
                type: 'new_daily_log',
                data: {
                    logId: log.id,
                    patientName: patientInfo.user.full_name,
                    moodRating: dto.mood_rating,
                    moodLevel: dto.mood_level,
                    date: dto.date,
                    riskFlag,
                },
            });
        }

        return log;
    }

    async findAll(userId: string) {
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
        });

        if (!patientProfile) return [];

        return this.prisma.dailyLog.findMany({
            where: { patient_id: patientProfile.id },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * Doctor access: get daily logs for a specific patient
     */
    async findByPatientId(patientId: string, limit = 30) {
        return this.prisma.dailyLog.findMany({
            where: { patient_id: patientId },
            orderBy: { date: 'desc' },
            take: limit,
        });
    }

    /**
     * Doctor dashboard: get recent logs from all linked patients
     */
    async findRecentForDoctor(doctorId: string, limit = 20) {
        return this.prisma.dailyLog.findMany({
            where: {
                patient: {
                    doctor_id: doctorId,
                },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        user: { select: { full_name: true } },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }
    async findToday(userId: string) {
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
        });

        if (!patientProfile) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const log = await this.prisma.dailyLog.findFirst({
            where: {
                patient_id: patientProfile.id,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        if (!log) return null;

        return {
            sleepHours: log.sleep_hours,
            sleepQuality: log.sleep_quality,
            moodRating: log.mood_rating,
            moodCompleted: !!log.mood_rating,
        };
    }
}
