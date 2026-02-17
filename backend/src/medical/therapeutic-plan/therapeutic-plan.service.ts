import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTherapeuticPlanDto } from './dto/create-therapeutic-plan.dto';
import { UpdateTherapeuticPlanDto } from './dto/update-therapeutic-plan.dto';

export interface TherapeuticGoals {
    short_term: any[];
    medium_term: any[];
    long_term: any[];
}

@Injectable()
export class TherapeuticPlanService {
    constructor(private prisma: PrismaService) { }

    /**
     * Structure goals as JSON for JSONB storage
     */
    private structureGoals(dto: CreateTherapeuticPlanDto | UpdateTherapeuticPlanDto): string {
        const goals: TherapeuticGoals = {
            short_term: dto.short_term_goals || [],
            medium_term: dto.medium_term_goals || [],
            long_term: dto.long_term_goals || [],
        };

        return JSON.stringify(goals);
    }

    /**
     * Parse goals from JSONB storage
     */
    private parseGoals(goalsJson: string | null): any[] {
        if (!goalsJson) {
            return [];
        }

        try {
            return typeof goalsJson === 'string' ? JSON.parse(goalsJson) : goalsJson;
        } catch {
            return [];
        }
    }

    /**
     * Create therapeutic plan
     * RF-015: Therapeutic plan management
     */
    async create(dto: CreateTherapeuticPlanDto, doctorId: string) {
        // Validate patient exists
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Structure goals as JSON
        const shortTermGoals = JSON.stringify(dto.short_term_goals || []);
        const mediumTermGoals = JSON.stringify(dto.medium_term_goals || []);
        const longTermGoals = JSON.stringify(dto.long_term_goals || []);

        return this.prisma.therapeuticPlan.create({
            data: {
                patient_id: dto.patient_id,
                short_term_goals: shortTermGoals,
                medium_term_goals: mediumTermGoals,
                long_term_goals: longTermGoals,
                strategies: dto.strategies,
                review_date: dto.review_date ? new Date(dto.review_date) : null,
                created_by: doctorId,
            },
        });
    }

    /**
     * Update therapeutic plan
     */
    async update(id: string, dto: UpdateTherapeuticPlanDto) {
        const existing = await this.prisma.therapeuticPlan.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Therapeutic plan not found');
        }

        // Merge goals with existing if provided
        const updateData: any = {};

        if (dto.short_term_goals) {
            updateData.short_term_goals = JSON.stringify(dto.short_term_goals);
        }
        if (dto.medium_term_goals) {
            updateData.medium_term_goals = JSON.stringify(dto.medium_term_goals);
        }
        if (dto.long_term_goals) {
            updateData.long_term_goals = JSON.stringify(dto.long_term_goals);
        }
        if (dto.strategies !== undefined) {
            updateData.strategies = dto.strategies;
        }
        if (dto.review_date) {
            updateData.review_date = new Date(dto.review_date);
        }

        return this.prisma.therapeuticPlan.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Get active plan for patient
     */
    async findActiveForPatient(patientId: string) {
        const plan = await this.prisma.therapeuticPlan.findFirst({
            where: {
                patient_id: patientId,
                deleted_at: null,
            },
            orderBy: { created_at: 'desc' },
        });

        if (!plan) {
            return null;
        }

        // Parse JSON goals for response
        return {
            ...plan,
            short_term_goals: this.parseGoals(plan.short_term_goals as string),
            medium_term_goals: this.parseGoals(plan.medium_term_goals as string),
            long_term_goals: this.parseGoals(plan.long_term_goals as string),
        };
    }

    async findActiveForUser(userId: string) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId }
        });

        if (!profile) return null;

        return this.findActiveForPatient(profile.id);
    }

    /**
     * Get patient history (Consultations + Plans)
     */
    async getPatientHistory(patientId: string) {
        const [consultations, plans] = await Promise.all([
            this.prisma.consultation.findMany({
                where: { patient_id: patientId },
                include: {
                    doctor: {
                        select: { full_name: true }
                    }
                },
                orderBy: { date_time: 'desc' }
            }),
            this.prisma.therapeuticPlan.findMany({
                where: { patient_id: patientId, deleted_at: null },
                orderBy: { created_at: 'desc' }
            })
        ]);

        // Manually fetch doctors for plans since the relation is not defined in schema
        const doctorIds = [...new Set(plans.map(p => p.created_by))];
        const doctors = await this.prisma.user.findMany({
            where: { id: { in: doctorIds } },
            select: { id: true, full_name: true }
        });

        const doctorMap = new Map(doctors.map(d => [d.id, d]));

        const plansWithDoctor = plans.map(plan => ({
            ...plan,
            doctor: doctorMap.get(plan.created_by) || null
        }));

        return {
            consultations,
            plans: plansWithDoctor
        };
    }

    /**
     * Get plan by ID
     */
    async findOne(id: string) {
        const plan = await this.prisma.therapeuticPlan.findUnique({
            where: { id },
            include: {
                patient: {
                    include: {
                        user: {
                            select: { full_name: true },
                        },
                    },
                },
            },
        });

        if (!plan) {
            throw new NotFoundException('Therapeutic plan not found');
        }

        // Parse JSON goals for response
        return {
            ...plan,
            short_term_goals: this.parseGoals(plan.short_term_goals as string),
            medium_term_goals: this.parseGoals(plan.medium_term_goals as string),
            long_term_goals: this.parseGoals(plan.long_term_goals as string),
        };
    }

    /**
     * Soft delete plan
     */
    async delete(id: string, doctorId: string) {
        const plan = await this.prisma.therapeuticPlan.findUnique({
            where: { id },
        });

        if (!plan) {
            throw new NotFoundException('Therapeutic plan not found');
        }

        return this.prisma.therapeuticPlan.update({
            where: { id },
            data: {
                deleted_at: new Date(),
            },
        });
    }
}
