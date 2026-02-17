import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionService {
    constructor(private prisma: PrismaService) { }

    async create(doctorId: string, dto: CreatePrescriptionDto) {
        const medication = await this.prisma.medication.findUnique({
            where: { id: dto.medication_id },
        });
        if (!medication) throw new NotFoundException('Medication not found');

        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });
        if (!patient) throw new NotFoundException('Patient not found');

        // RN-002: Interaction Checks / Safety
        // Check for active prescriptions for this patient
        const activePrescriptions = await this.prisma.prescription.findMany({
            where: {
                patient_id: dto.patient_id,
                is_active: true,
            },
            include: { medication: true },
        });

        const alerts: string[] = [];
        // Example check: if new med is 'sedative_potente' and patient already takes one
        if (medication.interaction_tags && Array.isArray(medication.interaction_tags)) {
            // Type assertion or check
            const tags = medication.interaction_tags as string[];
            if (tags.includes('sedative_potente')) {
                const hasSedative = activePrescriptions.some(p => {
                    const pTags = p.medication.interaction_tags as string[];
                    return pTags && pTags.includes('sedative_potente');
                });
                if (hasSedative) {
                    alerts.push('INTERACTION_WARNING: Patient already on sedative medication.');
                }
            }
        }

        // Create Prescription
        return this.prisma.prescription.create({
            data: {
                patient_id: dto.patient_id,
                medication_id: dto.medication_id,
                dosage: dto.dosage,
                frequency: dto.frequency,
                start_date: new Date(dto.start_date),
                end_date: dto.end_date ? new Date(dto.end_date) : null,
                is_active: true, // Default
            },
        });
    }

    async findOne(id: string) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: { medication: true },
        });
        if (!prescription) throw new NotFoundException('Prescription not found');
        return prescription;
    }

    async findAllForPatient(patientId: string) {
        return this.prisma.prescription.findMany({
            where: { patient_id: patientId, is_active: true },
            include: { medication: true },
            orderBy: { start_date: 'desc' },
        });
    }

    async findAllForUser(userId: string) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
        });
        if (!profile) return [];
        return this.findAllForPatient(profile.id);
    }

    async deactivate(id: string) {
        return this.prisma.prescription.update({
            where: { id },
            data: { is_active: false },
        });
    }
}
