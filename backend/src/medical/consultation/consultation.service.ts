import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ConsultationStatus } from '@prisma/client';

@Injectable()
export class ConsultationService {
    constructor(private prisma: PrismaService) { }

    async create(doctorId: string, dto: CreateConsultationDto) {
        // Validate Patient
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });
        if (!patientProfile) {
            throw new BadRequestException('Patient not found');
        }

        // Validate Doctor (can be implicit via JWT)

        // Create Draft
        return this.prisma.consultation.create({
            data: {
                patient_id: dto.patient_id,
                doctor_id: doctorId,
                date_time: new Date(dto.date_time),
                duration_minutes: dto.duration_minutes,
                modality: dto.modality,
                status: ConsultationStatus.DRAFT,
                anamnesis: dto.anamnesis,
                diagnostic_hypothesis: dto.diagnostic_hypothesis,
                treatment_plan: dto.treatment_plan,
            },
        });
    }

    async findAll(doctorId: string) {
        return this.prisma.consultation.findMany({
            where: { doctor_id: doctorId },
            include: { patient: { include: { user: { select: { full_name: true } } } } },
            orderBy: { date_time: 'desc' },
        });
    }

    async findOne(id: string) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id },
            include: { patient: true },
        });
        if (!consultation) throw new NotFoundException('Consultation not found');
        return consultation;
    }

    async update(id: string, updateData: Partial<CreateConsultationDto>) {
        // Add check if finalized (RN-016: finalized -> draft forbidden)
        const current = await this.prisma.consultation.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Consultation not found');
        if (current.status === ConsultationStatus.FINALIZED) {
            throw new BadRequestException('Cannot edit finalized consultation');
        }

        return this.prisma.consultation.update({
            where: { id },
            data: {
                ...updateData,
                date_time: updateData.date_time ? new Date(updateData.date_time) : undefined,
            }
        });
    }

    async finalize(id: string) {
        const current = await this.prisma.consultation.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Consultation not found');

        // Check required fields (RN-007)
        if (!current.anamnesis || !current.treatment_plan) {
            throw new BadRequestException('Cannot finalize: Missing Anamnesis or Treatment Plan');
        }

        return this.prisma.consultation.update({
            where: { id },
            data: {
                status: ConsultationStatus.FINALIZED,
                // signed_at: new Date(), // TODO: Digital Signature
            }
        });
    }
    async findNext(userId: string) {
        // Can be patient or doctor
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
        });

        const today = new Date();

        if (patientProfile) {
            const next = await this.prisma.consultation.findFirst({
                where: {
                    patient_id: patientProfile.id,
                    date_time: { gte: today },
                    status: { not: ConsultationStatus.CANCELLED },
                },
                orderBy: { date_time: 'asc' },
                include: {
                    doctor: {
                        select: { full_name: true }
                    }
                }
            });

            if (!next) return null;

            // Calculate days until
            const diffTime = Math.abs(next.date_time.getTime() - today.getTime());
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                doctorName: next.doctor.full_name,
                specialty: 'Psiquiatria', // TODO: Get from doctor profile if available
                date: next.date_time.toLocaleDateString(),
                time: next.date_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                modality: next.modality,
                daysUntil,
            };
        }

        return null;
    }
}
