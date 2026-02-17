import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClinicalEvolutionDto } from './dto/create-clinical-evolution.dto';

@Injectable()
export class ClinicalEvolutionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create clinical evolution
     * RF-018: Clinical evolution notes
     * Note: Content field should be encrypted at database level
     */
    async create(dto: CreateClinicalEvolutionDto, doctorId: string) {
        // Validate patient exists
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Validate consultation if provided
        if (dto.consultation_id) {
            const consultation = await this.prisma.consultation.findUnique({
                where: { id: dto.consultation_id },
            });

            if (!consultation) {
                throw new NotFoundException('Consultation not found');
            }
        }

        return this.prisma.clinicalEvolution.create({
            data: {
                consultation_id: dto.consultation_id,
                patient_id: dto.patient_id,
                type: dto.type,
                content: dto.content, // Will be encrypted by Prisma middleware if configured
                is_important_marker: dto.is_important_marker || false,
                created_by: doctorId,
            },
        });
    }

    /**
     * Get evolutions for patient
     */
    async findByPatient(
        patientId: string,
        limit: number = 50,
        type?: string
    ) {
        const where: any = {
            patient_id: patientId,
        };

        if (type) {
            where.type = type;
        }

        return this.prisma.clinicalEvolution.findMany({
            where,
            include: {
                consultation: {
                    select: {
                        date_time: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    /**
     * Get evolution by ID
     */
    async findOne(id: string) {
        const evolution = await this.prisma.clinicalEvolution.findUnique({
            where: { id },
            include: {
                consultation: {
                    select: {
                        date_time: true,
                        doctor: {
                            select: { full_name: true },
                        },
                    },
                },
                patient_profile: {
                    include: {
                        user: {
                            select: { full_name: true },
                        },
                    },
                },
            },
        });

        if (!evolution) {
            throw new NotFoundException('Clinical evolution not found');
        }

        return evolution;
    }

    /**
     * Get important evolutions (timeline markers)
     */
    async findImportantForPatient(patientId: string) {
        return this.prisma.clinicalEvolution.findMany({
            where: {
                patient_id: patientId,
                is_important_marker: true,
            },
            include: {
                consultation: {
                    select: {
                        date_time: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Get evolutions by consultation
     */
    async findByConsultation(consultationId: string) {
        return this.prisma.clinicalEvolution.findMany({
            where: {
                consultation_id: consultationId,
            },
            orderBy: { created_at: 'asc' },
        });
    }
}
