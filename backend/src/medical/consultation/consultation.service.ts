import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { CancelConsultationDto } from './dto/cancel-consultation.dto';
import { ConsultationStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ConsultationService {
    constructor(private prisma: PrismaService) { }

    /**
     * RN-013: CID-10 Validation Regex
     * Format: Letter + 2 digits + optional (. + 1-2 digits)
     * Examples: A00, B12.3, C45.67
     */
    private readonly CID10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;

    /**
     * Validate CID-10 codes format
     */
    private validateCid10Codes(codes: string[]): void {
        if (!codes || codes.length === 0) {
            throw new BadRequestException('At least one CID-10 code is required');
        }

        const invalidCodes = codes.filter(code => !this.CID10_REGEX.test(code));
        if (invalidCodes.length > 0) {
            throw new BadRequestException(
                `Invalid CID-10 format for codes: ${invalidCodes.join(', ')}. ` +
                `Expected format: [A-Z]\\d{2}(\\.\\d{1,2})?`
            );
        }
    }

    /**
     * Generate SHA-256 signature hash for consultation
     * RNF-005: Digital signature simulation
     * Note: Excludes encrypted fields to avoid exposing sensitive data
     */
    private generateSignatureHash(consultation: any, doctorCrm: string): string {
        // Sanitize data - exclude encrypted fields like anamnesis
        const dataToSign = {
            id: consultation.id,
            patient_id: consultation.patient_id,
            doctor_id: consultation.doctor_id,
            date_time: consultation.date_time,
            duration_minutes: consultation.duration_minutes,
            modality: consultation.modality,
            // anamnesis is encrypted - exclude from hash
            diagnostic_hypothesis: consultation.diagnostic_hypothesis,
            treatment_plan: consultation.treatment_plan,
            icd10_codes: consultation.icd10_codes,
            timestamp: new Date().toISOString(),
            crm: doctorCrm,
        };

        const dataString = JSON.stringify(dataToSign);
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Create a new consultation in DRAFT status
     */
    async create(doctorId: string, dto: CreateConsultationDto) {
        // Validate Patient
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { id: dto.patient_id },
        });
        if (!patientProfile) {
            throw new BadRequestException('Patient not found');
        }

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
                icd10_codes: dto.icd10_codes || [],
            },
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                full_name: true
                            }
                        }
                    }
                }
            }
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
            include: {
                patient: {
                    include: {
                        user: {
                            select: {
                                full_name: true,
                                email: true,
                                phone: true,
                                profile_picture: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        full_name: true,
                        crm: true
                    }
                }
            },
        });
        if (!consultation) throw new NotFoundException('Consultation not found');
        return consultation;
    }

    /**
     * Update consultation draft
     * RN-016: Only DRAFT consultations can be edited
     */
    async updateDraft(id: string, updateData: UpdateConsultationDto) {
        const current = await this.prisma.consultation.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Consultation not found');

        // RN-016: Cannot edit finalized or cancelled consultations
        if (current.status === ConsultationStatus.FINALIZED) {
            throw new BadRequestException(
                'Cannot edit finalized consultation. Create a new version if needed.'
            );
        }
        if (current.status === ConsultationStatus.CANCELLED) {
            throw new BadRequestException('Cannot edit cancelled consultation');
        }

        // Validate CID-10 codes if provided
        if (updateData.icd10_codes && updateData.icd10_codes.length > 0) {
            this.validateCid10Codes(updateData.icd10_codes);
        }

        return this.prisma.consultation.update({
            where: { id },
            data: {
                ...updateData,
                date_time: updateData.date_time ? new Date(updateData.date_time) : undefined,
            }
        });
    }

    /**
     * Legacy update method - redirects to updateDraft
     * @deprecated Use updateDraft instead
     */
    async update(id: string, updateData: Partial<CreateConsultationDto>) {
        return this.updateDraft(id, updateData as UpdateConsultationDto);
    }

    /**
     * Finalize consultation with validation and digital signature
     * RN-007: Required fields validation
     * RN-013: CID-10 format validation
     * RNF-005: Digital signature simulation
     */
    async finalizeConsultation(id: string, doctorCrm: string) {
        const current = await this.prisma.consultation.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Consultation not found');

        // Can only finalize DRAFT consultations
        if (current.status !== ConsultationStatus.DRAFT) {
            throw new BadRequestException(
                `Cannot finalize consultation with status ${current.status}. Only DRAFT consultations can be finalized.`
            );
        }

        // RN-007: Validate required fields
        if (!current.anamnesis || current.anamnesis.trim().length < 10) {
            throw new BadRequestException('Anamnesis is required and must be at least 10 characters');
        }
        if (!current.treatment_plan || current.treatment_plan.trim().length === 0) {
            throw new BadRequestException('Treatment plan is required');
        }

        // RN-013: Validate CID-10 codes
        this.validateCid10Codes(current.icd10_codes);

        // Generate digital signature hash (RNF-005)
        const signatureHash = this.generateSignatureHash(current, doctorCrm);

        return this.prisma.consultation.update({
            where: { id },
            data: {
                status: ConsultationStatus.FINALIZED,
                signed_at: new Date(),
                signature_hash: signatureHash,
            }
        });
    }

    /**
     * Legacy finalize method - redirects to finalizeConsultation
     * @deprecated Use finalizeConsultation instead
     */
    async finalize(id: string) {
        // Get doctor CRM from consultation
        const consultation = await this.prisma.consultation.findUnique({
            where: { id },
            include: { doctor: { select: { crm: true } } },
        });
        if (!consultation) throw new NotFoundException('Consultation not found');

        const doctorCrm = consultation.doctor.crm || 'UNKNOWN';
        return this.finalizeConsultation(id, doctorCrm);
    }

    /**
     * Cancel consultation with mandatory reason
     * RN-016: Cancellation requires justification
     */
    async cancelConsultation(id: string, cancelDto: CancelConsultationDto) {
        const current = await this.prisma.consultation.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Consultation not found');

        // Already cancelled
        if (current.status === ConsultationStatus.CANCELLED) {
            throw new BadRequestException('Consultation is already cancelled');
        }

        // RN-016: Mandatory cancellation reason
        if (!cancelDto.cancelled_reason || cancelDto.cancelled_reason.trim().length < 10) {
            throw new BadRequestException(
                'Cancellation reason is required and must be at least 10 characters'
            );
        }

        return this.prisma.consultation.update({
            where: { id },
            data: {
                status: ConsultationStatus.CANCELLED,
                cancelled_reason: cancelDto.cancelled_reason,
                cancelled_at: new Date(),
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
