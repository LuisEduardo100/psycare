import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormalPrescriptionDto, PrescriptionType } from './dto/create-formal-prescription.dto';
import { RevokePrescriptionDto } from './dto/revoke-prescription.dto';
import { ConsultationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class FormalPrescriptionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Validate that medication is indicated for consultation diagnosis
     * RN-006: Cross-validation between medication and diagnosis
     */
    private async validateMedicationForDiagnosis(
        medicationId: string,
        consultationIcd10Codes: string[]
    ): Promise<void> {
        const medication = await this.prisma.medication.findUnique({
            where: { id: medicationId },
            select: { indication_cids: true, name: true },
        });

        if (!medication) {
            throw new NotFoundException(`Medication ${medicationId} not found`);
        }

        // Check if any medication indication matches consultation diagnosis
        const hasMatch = medication.indication_cids.some(cid =>
            consultationIcd10Codes.includes(cid)
        );

        if (!hasMatch) {
            throw new BadRequestException(
                `Medication "${medication.name}" is not indicated for the diagnosed conditions. ` +
                `Medication indications: ${medication.indication_cids.join(', ')}. ` +
                `Consultation diagnoses: ${consultationIcd10Codes.join(', ')}`
            );
        }
    }

    /**
     * Determine prescription type based on medications
     * RN-010: Prescription type classification
     */
    private async determinePrescriptionType(medicationIds: string[]): Promise<PrescriptionType> {
        const medications = await this.prisma.medication.findMany({
            where: { id: { in: medicationIds } },
            select: { is_controlled: true, interaction_tags: true },
        });

        const hasControlled = medications.some(m => m.is_controlled);
        const hasAntibiotic = medications.some(m =>
            Array.isArray(m.interaction_tags) && m.interaction_tags.includes('antibiotic')
        );

        if (hasAntibiotic) return PrescriptionType.ANTIMICROBIANA;
        if (hasControlled) return PrescriptionType.CONTROLADA;
        return PrescriptionType.SIMPLES;
    }

    /**
     * Calculate valid_until date based on prescription type
     */
    private calculateValidUntil(type: PrescriptionType): Date {
        const now = new Date();
        const daysValid = {
            [PrescriptionType.SIMPLES]: 30,
            [PrescriptionType.CONTROLADA]: 30,
            [PrescriptionType.ANTIMICROBIANA]: 10,
        };

        const validUntil = new Date(now);
        validUntil.setDate(validUntil.getDate() + daysValid[type]);
        return validUntil;
    }

    /**
     * Generate SHA-256 signature hash for prescription
     * RNF-005: Digital signature simulation
     */
    private generateSignatureHash(prescription: any, doctorCrm: string): string {
        const dataToSign = {
            id: prescription.id,
            consultation_id: prescription.consultation_id,
            patient_id: prescription.patient_id,
            type: prescription.type,
            items: prescription.items,
            timestamp: new Date().toISOString(),
            crm: doctorCrm,
        };

        const dataString = JSON.stringify(dataToSign);
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Create formal prescription with validation
     * RF-017: Formal prescription creation
     * RN-006: Cross-validation
     */
    async createFormalPrescription(dto: CreateFormalPrescriptionDto, doctorCrm: string) {
        // Validate consultation exists and is finalized
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: dto.consultation_id },
            include: { doctor: { select: { crm: true } } },
        });

        if (!consultation) {
            throw new NotFoundException('Consultation not found');
        }

        if (consultation.status !== ConsultationStatus.FINALIZED) {
            throw new BadRequestException(
                'Cannot create formal prescription for non-finalized consultation. ' +
                'Please finalize the consultation first.'
            );
        }

        // Validate patient
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });

        if (!patient) {
            throw new NotFoundException('Patient not found');
        }

        // Cross-validate each medication against consultation diagnosis (RN-006)
        const medicationIds = dto.items.map(item => item.medication_id);
        for (const medicationId of medicationIds) {
            await this.validateMedicationForDiagnosis(
                medicationId,
                consultation.icd10_codes
            );
        }

        // Determine prescription type (can override if doctor specified)
        const determinedType = await this.determinePrescriptionType(medicationIds);
        if (dto.type !== determinedType) {
            // Log warning but allow doctor's choice
            console.warn(
                `Prescription type mismatch: Doctor specified ${dto.type}, ` +
                `system determined ${determinedType}`
            );
        }

        // Calculate valid_until date
        const validUntil = this.calculateValidUntil(dto.type);

        // Create formal prescription
        const prescription = await this.prisma.formalPrescription.create({
            data: {
                consultation_id: dto.consultation_id,
                patient_id: dto.patient_id,
                type: dto.type,
                is_valid: true,
                valid_until: validUntil,
                items: {
                    create: dto.items.map(item => ({
                        medication_id: item.medication_id,
                        dosage: item.dosage,
                        quantity: item.quantity,
                        form: item.form,
                        duration: item.duration,
                        instructions: item.instructions,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        medication: true,
                    },
                },
            },
        });

        // Generate signature hash
        const signatureHash = this.generateSignatureHash(
            prescription,
            doctorCrm || consultation.doctor.crm || 'UNKNOWN'
        );

        // Update with signature
        const finalPrescription = await this.prisma.formalPrescription.update({
            where: { id: prescription.id },
            data: {
                signature_hash: signatureHash,
                signed_at: new Date(),
            },
            include: {
                items: {
                    include: {
                        medication: true,
                    },
                },
                patient: {
                    include: {
                        user: true,
                    },
                },
                consultation: {
                    include: {
                        doctor: {
                            select: { full_name: true, crm: true, uf: true },
                        },
                    },
                },
            },
        });

        // Loop through items to create/update active prescriptions in patient profile
        for (const item of dto.items) {
            // Deactivate any existing active prescription for this medication
            await this.prisma.prescription.updateMany({
                where: {
                    patient_id: dto.patient_id,
                    medication_id: item.medication_id,
                    is_active: true
                },
                data: {
                    is_active: false,
                    end_date: new Date()
                }
            });

            // Create new active prescription
            await this.prisma.prescription.create({
                data: {
                    patient_id: dto.patient_id,
                    medication_id: item.medication_id,
                    dosage: item.dosage,
                    frequency: item.frequency || 'Conforme orientação médica',
                    form: item.form,
                    duration: item.duration,
                    instructions: item.instructions,
                    start_date: new Date(),
                    end_date: validUntil, // Default to prescription validity
                    is_active: true
                }
            });
        }

        return finalPrescription;
    }

    /**
     * Get prescription by ID
     */
    async findOne(id: string) {
        const prescription = await this.prisma.formalPrescription.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        medication: true,
                    },
                },
                patient: {
                    include: {
                        user: true,
                    },
                },
                consultation: {
                    include: {
                        doctor: {
                            select: { full_name: true, crm: true, uf: true },
                        },
                    },
                },
            },
        });

        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }

        return prescription;
    }

    /**
     * Get prescriptions for a patient
     */
    async findByPatient(patientId: string) {
        return this.prisma.formalPrescription.findMany({
            where: { patient_id: patientId },
            include: {
                items: {
                    include: {
                        medication: true,
                    },
                },
                consultation: {
                    select: {
                        date_time: true,
                        doctor: {
                            select: { full_name: true },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Revoke prescription
     * RN-010: Prescription revocation with reason
     */
    async revokePrescription(id: string, revokeDto: RevokePrescriptionDto) {
        const prescription = await this.prisma.formalPrescription.findUnique({
            where: { id },
        });

        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }

        if (!prescription.is_valid) {
            throw new BadRequestException('Prescription is already revoked');
        }

        return this.prisma.formalPrescription.update({
            where: { id },
            data: {
                is_valid: false,
                revoked_at: new Date(),
                revoked_reason: revokeDto.revoked_reason,
            },
        });
    }

    /**
     * Prepare data for PDF generation (optional/simulated)
     * Returns structured data ready for PDF service
     */
    async preparePdfData(id: string) {
        const prescription = await this.prisma.formalPrescription.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        medication: true,
                    },
                },
                patient: {
                    include: {
                        user: true,
                    },
                },
                consultation: {
                    include: {
                        doctor: true,
                    },
                },
            },
        });

        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }

        return {
            // Header
            prescriptionId: prescription.id,
            issueDate: prescription.created_at,
            validUntil: prescription.valid_until,
            type: prescription.type,

            // Doctor info
            doctor: {
                name: prescription.consultation.doctor.full_name,
                crm: prescription.consultation.doctor.crm || 'N/A',
                uf: prescription.consultation.doctor.uf || 'N/A',
            },

            // Patient info
            patient: {
                name: prescription.patient.user.full_name,
            },

            // Medications
            medications: prescription.items.map(item => ({
                name: item.medication.name,
                activeIngredient: item.medication.active_ingredient,
                concentration: item.medication.concentration,
                form: item.medication.form,
                dosage: item.dosage,
                quantity: item.quantity,
                instructions: item.instructions,
            })),

            // Signature
            signatureHash: prescription.signature_hash,
            signedAt: prescription.signed_at,

            // Status
            isValid: prescription.is_valid,
            revokedAt: prescription.revoked_at,
            revokedReason: prescription.revoked_reason,
        };
    }

}
