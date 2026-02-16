import { PrismaClient, Role, Gender, MaritalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@psycare.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    console.log(`Seeding admin user: ${adminEmail}`);

    // Clean up database to avoid conflicts
    try {
        await prisma.auditLog.deleteMany();
        await prisma.notificationLog.deleteMany();
        await prisma.consentLog.deleteMany();
        await prisma.clinicalDocument.deleteMany();
        await prisma.alert.deleteMany();
        await prisma.therapeuticPlan.deleteMany();
        await prisma.formalPrescriptionItem.deleteMany();
        await prisma.formalPrescription.deleteMany();
        await prisma.clinicalEvolution.deleteMany();
        await prisma.consultation.deleteMany();
        await prisma.prescription.deleteMany();
        await prisma.dailyLog.deleteMany();
        await prisma.patientProfile.deleteMany();
        // User and Medication might be kept or upserted, but for clean state:
        // await prisma.user.deleteMany(); // Upsert handles users
        // await prisma.medication.deleteMany(); // Logic handles medications
    } catch (e) {
        console.warn('Cleanup warning (ignore if first run):', e);
    }

    try {
        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                full_name: 'Admin User',
                password_hash: hashedPassword,
                role: Role.ADMIN,
                two_factor_enabled: false,
            },
        });
        console.log('Admin user created/updated:', admin);
    } catch (e) {
        console.error('Error seeding admin:', e);
    }

    // Seed Medications
    const medications = [
        {
            name: 'Sertralina',
            active_ingredient: 'Cloridrato de Sertralina',
            concentration: '50mg',
            form: 'Comprimido revestido',
            interaction_tags: ['risco_serotoninergico'],
            indication_cids: ['F32', 'F33', 'F41'],
            is_controlled: true,
        },
        {
            name: 'Clonazepam',
            active_ingredient: 'Clonazepam',
            concentration: '2mg',
            form: 'Comprimido',
            interaction_tags: ['sedativo_potente', 'alcool_proibido'],
            indication_cids: ['F41.0', 'F41.1'],
            is_controlled: true, // B1
        },
        {
            name: 'Quetiapina',
            active_ingredient: 'Fumarato de Quetiapina',
            concentration: '25mg',
            form: 'Comprimido',
            interaction_tags: ['sedativo_potente', 'ganho_peso'],
            indication_cids: ['F20', 'F31'],
            is_controlled: true,
        }
    ];

    console.log('Seeding medications...');
    for (const med of medications) {
        // Simple check to avoid UUID issues in upsert
        const existing = await prisma.medication.findFirst({
            where: { name: med.name, concentration: med.concentration }
        });

        if (!existing) {
            await prisma.medication.create({ data: med });
        }
    }
    console.log('Medications seeded.');

    // Seed Doctor
    const doctorEmail = 'doctor@psycare.com';
    const doctor = await prisma.user.upsert({
        where: { email: doctorEmail },
        update: {},
        create: {
            email: doctorEmail,
            full_name: 'Dr. House',
            password_hash: hashedPassword,
            role: Role.DOCTOR,
            two_factor_enabled: false,
        },
    });
    console.log('Doctor created.');

    // Seed Patient
    const patientEmail = 'patient@psycare.com';
    const patientUser = await prisma.user.upsert({
        where: { email: patientEmail },
        update: {},
        create: {
            email: patientEmail,
            full_name: 'Patient Zero',
            password_hash: hashedPassword,
            role: Role.PATIENT,
            two_factor_enabled: false,
        },
    });

    // Create Profile if not exists
    let profile = await prisma.patientProfile.findUnique({ where: { user_id: patientUser.id } });
    if (!profile) {
        profile = await prisma.patientProfile.create({
            data: {
                user_id: patientUser.id,
                cpf: '12345678900',
                gender: Gender.MALE,
                marital_status: MaritalStatus.SINGLE,
                birth_date: new Date('1990-01-01'),
            }
        });

        // Log Consent
        await prisma.consentLog.create({
            data: {
                patient_id: profile.id,
                term_version: '1.0',
                ip_address: '127.0.0.1',
                user_agent: 'Seed Script',
            }
        });
        console.log('Patient Profile created.');
    }

    // Link Patient to Doctor
    if (profile && doctor) {
        await prisma.patientProfile.update({
            where: { id: profile.id },
            data: { doctor_id: doctor.id }
        });
        console.log('Patient linked to Doctor.');
    }

    // Seed LCM Daily Log
    if (profile) {
        // Check if log exists for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingLog = await prisma.dailyLog.findUnique({
            where: { patient_id_date: { patient_id: profile.id, date: today } }
        });

        if (!existingLog) {
            await prisma.dailyLog.create({
                data: {
                    patient_id: profile.id,
                    date: today,
                    mood_rating: 2, // Low/Sad (1-5 scale, 2 is "Sad")
                    mood_level: -2, // Depression Moderate
                    anxiety_level: 1, // Mild
                    irritability_level: 0, // None
                    sleep_hours: 6.5,
                    notes: 'Feeling a bit low today.',
                    exercise_minutes: 30,
                    exercise_type: 'Walking',
                }
            });
            console.log('LCM Daily Log seeded.');
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
