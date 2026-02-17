import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, Gender, MaritalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MailService } from '../common/mail/mail.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService
    ) { }

    // ... (rest of methods)

    async invitePatient(doctorId: string, dto: { email: string; fullName: string }) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpires = new Date();
        inviteExpires.setHours(inviteExpires.getHours() + 48); // 48h expiry

        // Create user with a dummy password and the invite token
        // Use a random password that can't be guessed
        const dummyPassword = crypto.randomBytes(16).toString('base64');
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dummyPassword, salt);

        const result = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    full_name: dto.fullName,
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    invite_token: inviteToken,
                    invite_expires: inviteExpires,
                },
            });

            const profile = await tx.patientProfile.create({
                data: {
                    user_id: newUser.id,
                    doctor_id: doctorId,
                    cpf: `PENDING_${newUser.id.substring(0, 8)}`, // Placeholder
                    birth_date: new Date(), // Placeholder
                    gender: 'OTHER',
                    marital_status: 'SINGLE',
                },
            });

            return { user: newUser, profile, inviteToken };
        });

        // Send email
        await this.mailService.sendInvitationEmail(dto.email, inviteToken, dto.fullName);

        return result;
    }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(data.password_hash, salt);

        return this.prisma.user.create({
            data: {
                ...data,
                password_hash: hashedPassword,
            },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async createPatientProfile(userId: string, data: any) {
        // Here you can handle termsAccepted logic if needed, e.g. logging consent
        // For now we extract it as it is not in the PatientProfile model directly
        const { termsAccepted, birthDate, ...rest } = data;

        console.log('Creating profile for user:', userId);
        console.log('Data:', JSON.stringify(data));

        try {
            return await this.prisma.patientProfile.create({
                data: {
                    cpf: rest.cpf,
                    gender: rest.gender,
                    marital_status: rest.maritalStatus,
                    profession: rest.profession,
                    emergency_contact: rest.emergencyContact,
                    emergency_phone: rest.emergencyPhone,
                    birth_date: new Date(birthDate),
                    user: {
                        connect: { id: userId }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating patient profile:', error);
            throw error;
        }
    }

    async findPatientProfile(userId: string) {
        return this.prisma.patientProfile.findUnique({
            where: { user_id: userId }
        });
    }

    async findAllPatients(doctorId: string) {
        const users = await this.prisma.user.findMany({
            where: {
                role: 'PATIENT',
                patient_profile: {
                    doctor_id: doctorId
                }
            },
            include: {
                patient_profile: {
                    include: {
                        consultations: {
                            where: { doctor_id: doctorId },
                            orderBy: { date_time: 'desc' },
                            take: 5,
                            select: { id: true, date_time: true, status: true }
                        },
                        prescriptions: {
                            where: { is_active: true },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { full_name: 'asc' }
        });

        return users.map(user => {
            const { password_hash, profile_picture, patient_profile, ...rest } = user;

            // Find last finalized consultation
            const lastConsultation = patient_profile?.consultations?.find((c: any) => c.status === 'FINALIZED')?.date_time || null;

            // Find pending draft
            const draftConsultation = patient_profile?.consultations?.find(c => c.status === 'DRAFT');
            const draftConsultationId = draftConsultation?.id || null;

            const activePrescriptionsCount = patient_profile?.prescriptions?.length || 0;

            return {
                ...rest,
                patient_profile: {
                    id: patient_profile?.id,
                    cpf: patient_profile?.cpf,
                    birth_date: patient_profile?.birth_date,
                    gender: patient_profile?.gender,
                    marital_status: patient_profile?.marital_status,
                },
                hasAvatar: !!profile_picture,
                lastConsultation,
                activePrescriptionsCount,
                draftConsultationId
            };
        });
    }
    async createPatient(doctorId: string, dto: any) {
        let user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });

        if (user) {
            // User exists, check if already linked or not a patient
            if (user.role !== 'PATIENT') {
                throw new BadRequestException('Email belongs to a non-patient user');
            }

            // Check if profile exists
            let profile = await this.prisma.patientProfile.findUnique({
                where: { user_id: user.id }
            });

            if (profile) {
                if (profile.doctor_id) {
                    throw new ConflictException('Patient is already linked to a doctor');
                }
                // Link to this doctor
                await this.prisma.patientProfile.update({
                    where: { id: profile.id },
                    data: { doctor_id: doctorId }
                });
            } else {
                // Create profile and link
                await this.prisma.patientProfile.create({
                    data: {
                        user_id: user.id,
                        doctor_id: doctorId,
                        cpf: '',
                        birth_date: new Date(),
                        gender: 'OTHER',
                        marital_status: 'SINGLE'
                    }
                });
            }
            return user;
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.password, salt);

        // Transaction to create User and PatientProfile
        return this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: dto.email,
                    full_name: dto.full_name,
                    password_hash: hashedPassword,
                    role: 'PATIENT',
                    two_factor_enabled: false,
                }
            });

            await tx.patientProfile.create({
                data: {
                    user_id: newUser.id,
                    doctor_id: doctorId,
                    // Minimal profile for now
                    cpf: `PENDING_${newUser.id.substring(0, 8)}`,
                    birth_date: new Date(),
                    gender: 'OTHER',
                    marital_status: 'SINGLE'
                }
            });

            return newUser;
        });
    }

    async updatePassword(userId: string, dto: any) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(dto.old_password, user.password_hash);
        if (!isMatch) throw new UnauthorizedException('Password mismatch');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.new_password, salt);

        return this.prisma.user.update({
            where: { id: userId },
            data: { password_hash: hashedPassword }
        });
    }

    /**
     * Comprehensive patient detail for doctor view
     */
    async findPatientDetail(doctorId: string, patientId: string) {
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            include: {
                user: {
                    select: {
                        id: true, full_name: true, email: true, phone: true,
                        profile_picture: true,
                        created_at: true, last_login: true,
                    },
                },
            },
        });

        if (!patient) throw new NotFoundException('Patient not found');
        if (patient.doctor_id !== doctorId) throw new UnauthorizedException('Unauthorized: patient not linked to this doctor');

        // Fetch related data in parallel
        const [dailyLogs, prescriptions, alerts, consultations, clinicalEvolutions, therapeuticPlans] = await Promise.all([
            this.prisma.dailyLog.findMany({
                where: { patient_id: patientId },
                orderBy: { date: 'desc' },
                take: 180, // Extended to support 6-month view
            }),
            this.prisma.prescription.findMany({
                where: { patient_id: patientId },
                include: { medication: true },
                orderBy: { start_date: 'desc' },
            }),
            this.prisma.alert.findMany({
                where: { patient_id: patientId },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
            this.prisma.consultation.findMany({
                where: { patient_id: patientId, doctor_id: doctorId },
                orderBy: { date_time: 'desc' },
                take: 10,
            }),
            this.prisma.clinicalEvolution.findMany({
                where: { patient_id: patientId },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
            this.prisma.therapeuticPlan.findMany({
                where: { patient_id: patientId, deleted_at: null },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);

        return {
            ...patient,
            dailyLogs,
            prescriptions,
            alerts,
            consultations,
            clinical_evolutions: clinicalEvolutions,
            draftConsultationId: consultations.find(c => c.status === 'DRAFT')?.id || null,
            activeTherapeuticPlanId: therapeuticPlans.find(p => !p.deleted_at)?.id || null
        };
    }

    /**
     * Paginated timeline: daily logs + consultations + alerts + prescriptions + clinical evolutions
     */
    async getPatientTimeline(doctorId: string, patientId: string, page = 1, limit = 20) {
        const patient = await this.prisma.patientProfile.findUnique({
            where: { id: patientId },
            select: { doctor_id: true },
        });

        if (!patient) throw new NotFoundException('Patient not found');
        if (patient.doctor_id !== doctorId) throw new UnauthorizedException('Unauthorized');

        // Fetch all event types
        const [dailyLogs, consultations, alerts, prescriptions, clinicalEvolutions] = await Promise.all([
            this.prisma.dailyLog.findMany({
                where: { patient_id: patientId },
                orderBy: { date: 'desc' },
            }),
            this.prisma.consultation.findMany({
                where: { patient_id: patientId },
                orderBy: { date_time: 'desc' },
            }),
            this.prisma.alert.findMany({
                where: { patient_id: patientId },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.prescription.findMany({
                where: { patient_id: patientId },
                include: { medication: true },
                orderBy: { start_date: 'desc' },
            }),
            this.prisma.clinicalEvolution.findMany({
                where: { patient_id: patientId },
                orderBy: { created_at: 'desc' },
            }),
        ]);

        // Unify into timeline events
        const events = [
            ...dailyLogs.map(log => ({
                type: 'daily_log' as const,
                date: log.date,
                data: log,
            })),
            ...consultations.map(c => ({
                type: 'consultation' as const,
                date: c.date_time,
                data: c,
            })),
            ...alerts.map(a => ({
                type: 'alert' as const,
                date: a.created_at,
                data: a,
            })),
            ...prescriptions.map(p => ({
                type: 'prescription' as const,
                date: p.start_date,
                data: p,
            })),
            ...clinicalEvolutions.map(e => ({
                type: 'clinical_evolution' as const,
                date: e.created_at,
                data: e,
            })),
        ];

        // Sort by date DESC and paginate
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const start = (page - 1) * limit;
        const paginatedEvents = events.slice(start, start + limit);

        return {
            events: paginatedEvents,
            total: events.length,
            page,
            totalPages: Math.ceil(events.length / limit),
        };
    }



    async findByInviteToken(token: string) {
        return this.prisma.user.findFirst({
            where: {
                invite_token: token,
                invite_expires: { gt: new Date() },
            },
        });
    }
    async getDashboardTimeline(userId: string) {
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
        });

        if (!patientProfile) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [dailyLogs, consultations, prescriptions] = await Promise.all([
            this.prisma.dailyLog.findMany({
                where: {
                    patient_id: patientProfile.id,
                    date: { gte: today, lt: tomorrow },
                },
            }),
            this.prisma.consultation.findMany({
                where: {
                    patient_id: patientProfile.id,
                    date_time: { gte: today, lt: tomorrow },
                },
                include: { doctor: true }
            }),
            this.prisma.prescription.findMany({
                where: {
                    patient_id: patientProfile.id,
                    is_active: true,
                    start_date: { lte: today },
                    OR: [
                        { end_date: null },
                        { end_date: { gte: today } }
                    ]
                },
                include: { medication: true }
            })
        ]);

        const timeline: {
            id: string;
            type: string;
            title: string;
            description: string;
            time: string;
            icon: string;
        }[] = [];

        // Map Consultations
        consultations.forEach(c => {
            timeline.push({
                id: c.id,
                type: 'note', // Using note type for appointments for now
                title: `Consulta: ${c.doctor.full_name}`,
                description: c.modality,
                time: c.date_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                icon: 'clipboard'
            });
        });

        // Map Daily Logs
        dailyLogs.forEach(l => {
            if (l.sleep_hours) {
                timeline.push({
                    id: `${l.id}-sleep`,
                    type: 'sleep',
                    title: 'Sono Registrado',
                    description: `${l.sleep_hours}h de sono - Qualidade: ${l.sleep_quality || 'N/A'}`,
                    time: l.sleep_wake_time ? l.sleep_wake_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00',
                    icon: 'moon'
                });
            }
            if (l.mood_rating) {
                timeline.push({
                    id: `${l.id}-mood`,
                    type: 'note',
                    title: 'Humor Registrado',
                    description: `Nível: ${l.mood_rating}`,
                    time: 'Agora', // TODO: Add time to DailyLog
                    icon: 'clipboard'
                });
            }
        });

        // Map Prescriptions (Mocking times for now)
        prescriptions.forEach(p => {
            timeline.push({
                id: p.id,
                type: 'medication',
                title: p.medication.name,
                description: `${p.dosage} - ${p.frequency}`,
                time: '08:00', // Mock time
                icon: 'pill'
            });
        });

        return timeline.sort((a, b) => a.time.localeCompare(b.time));
    }
    async getLinkedDoctor(userId: string) {
        const profile = await this.prisma.patientProfile.findUnique({
            where: { user_id: userId },
            include: { doctor: true }
        });

        if (!profile || !profile.doctor) {
            return null;
        }

        const { password_hash, two_factor_secret, recovery_codes, profile_picture, ...doctorData } = profile.doctor;
        return {
            ...doctorData,
            profile_picture,
            hasAvatar: !!profile_picture
        };
    }
    async updateProfile(userId: string, data: {
        fullName?: string;
        phone?: string;
        profilePicture?: any;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        cpf?: string;
    }) {
        const updateData: any = {};
        if (data.fullName) updateData.full_name = data.fullName;
        if (data.phone) updateData.phone = data.phone;
        if (data.profilePicture) updateData.profile_picture = data.profilePicture;

        // Address Fields
        if (data.street) updateData.street = data.street;
        if (data.number) updateData.number = data.number;
        if (data.complement) updateData.complement = data.complement;
        if (data.neighborhood) updateData.neighborhood = data.neighborhood;
        if (data.city) updateData.city = data.city;
        if (data.state) updateData.state = data.state;
        if (data.zipCode) updateData.zip_code = data.zipCode;

        // Handle CPF logic
        if (data.cpf) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user && user.role === 'PATIENT') {
                const profile = await this.findPatientProfile(userId);
                if (profile) {
                    await this.prisma.patientProfile.update({
                        where: { id: profile.id },
                        data: { cpf: data.cpf }
                    });
                }
            } else {
                updateData.cpf = data.cpf;
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: updateData
        });
    }

    async updateProfilePicturePath(userId: string, filename: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (user && user.profile_picture) {
            // Check if it's a local file (not base64 and not external url)
            const isLocal = !user.profile_picture.startsWith('http') && !user.profile_picture.startsWith('data:');
            if (isLocal) {
                const oldPath = path.join(process.cwd(), 'uploads/avatars', user.profile_picture);
                if (fs.existsSync(oldPath)) {
                    try {
                        fs.unlinkSync(oldPath);
                    } catch (err) {
                        console.error('Failed to delete old avatar:', err);
                    }
                }
            }
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { profile_picture: filename }
        });
    }

    async getProfilePicture(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { profile_picture: true }
        });

        if (!user || !user.profile_picture) {
            return null;
        }

        // Check if it's a legacy Base64 string
        if (user.profile_picture.startsWith('data:')) {
            const matches = user.profile_picture.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return null;
            }
            return {
                mimeType: matches[1],
                buffer: Buffer.from(matches[2], 'base64')
            };
        }

        // Otherwise, assume it's a filename
        return {
            filePath: user.profile_picture
        };
    }

    async searchPatients(query: string) {
        if (!query || query.length < 3) return [];

        return this.prisma.user.findMany({
            where: {
                role: 'PATIENT',
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { full_name: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                full_name: true,
                email: true,
                profile_picture: true,
                patient_profile: {
                    select: { doctor_id: true }
                }
            },
            take: 10
        });
    }

    async linkPatient(doctorId: string, patientUserId: string) {
        const patientProfile = await this.prisma.patientProfile.findUnique({
            where: { user_id: patientUserId }
        });

        if (!patientProfile) {
            // Should create profile if missing? 
            // Better to assume if they are PATIENT role they might not have profile yet if just registered?
            // Actually, currently registration allows creating PATIENT without profile?
            // `register` in AuthService calls `usersService.create`.
            // User might exist without profile.
            // Let's create profile if missing.
            return this.prisma.patientProfile.create({
                data: {
                    user_id: patientUserId,
                    doctor_id: doctorId,
                    cpf: '',
                    birth_date: new Date(),
                    gender: 'OTHER',
                    marital_status: 'SINGLE'
                }
            });
        }

        if (patientProfile.doctor_id) {
            if (patientProfile.doctor_id === doctorId) {
                throw new ConflictException('Patient already linked to you');
            }
            throw new ConflictException('Patient already linked to another doctor');
        }

        return this.prisma.patientProfile.update({
            where: { id: patientProfile.id },
            data: { doctor_id: doctorId }
        });
    }

    async createPasswordResetToken(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Silently return to prevent enumeration attacks, or throw if preferred.
            // For better UX in this context, we might throw NotFound or just return generic success.
            // Let's return null to indicate no email sent, but controller should handle it gracefully.
            return null;
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                reset_token: resetToken,
                reset_expires: resetExpires
            }
        });

        await this.mailService.sendPasswordResetEmail(user.email, resetToken, user.full_name);
        return true;
    }

    async resetPasswordWithToken(token: string, newPassword: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                reset_token: token,
                reset_expires: { gt: new Date() }
            }
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                reset_token: null,
                reset_expires: null
            }
        });
    }

    async requestEmailChange(userId: string, newEmail: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Check if email is already taken by another user
        const existingUser = await this.prisma.user.findUnique({ where: { email: newEmail } });
        if (existingUser) throw new ConflictException('Email already in use');

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 24); // 24h expiry

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                new_email: newEmail,
                email_change_token: token,
                email_change_expires: expires
            }
        });

        await this.mailService.sendEmailChangeConfirmation(newEmail, token, user.full_name);
        return { message: 'Confirmation email sent' };
    }

    async confirmEmailChange(token: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email_change_token: token,
                email_change_expires: { gt: new Date() }
            }
        });

        if (!user || !user.new_email) {
            throw new BadRequestException('Invalid or expired token');
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                email: user.new_email,
                new_email: null,
                email_change_token: null,
                email_change_expires: null
            }
        });

        return { message: 'Email updated successfully' };
    }
}
