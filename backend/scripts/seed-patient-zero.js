const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PATIENT_ID = 'ef9e21e9-4a72-417a-97a5-060dfdab8368';
const USER_ID = 'c71aa435-0163-4e67-aac0-f93da17fb6b5';
const DOCTOR_ID = 'a65dad17-1970-4a0a-908a-95c73a79e0b4';

const SERTRALINA_ID = '56f29a47-8f55-4b08-863b-ae2c0bb90bca';
const QUETIAPINA_ID = 'f4db6dab-2072-4549-9bd4-c6682c144b99';

async function main() {
    console.log('Starting seed for Patient Zero...');

    // 1. Cleanup
    try {
        await prisma.dailyLog.deleteMany({ where: { patient_id: PATIENT_ID } });
        await prisma.prescription.deleteMany({ where: { patient_id: PATIENT_ID } });
        await prisma.alert.deleteMany({ where: { patient_id: PATIENT_ID } });
        await prisma.therapeuticPlan.deleteMany({ where: { patient_id: PATIENT_ID } });
        await prisma.consultation.deleteMany({ where: { patient_id: PATIENT_ID } });
        console.log('Cleanup finished.');
    } catch (e) {
        console.log('Cleanup error (might be due to foreign keys):', e.message);
    }

    // 2. Daily Logs (30 days)
    const logs = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const bedtime = new Date(date);
        bedtime.setHours(23, 0, 0, 0);
        
        const wakeTime = new Date(date);
        wakeTime.setDate(date.getDate() + 1);
        wakeTime.setHours(7, 30, 0, 0);

        logs.push({
            patient_id: PATIENT_ID,
            date: date,
            mood_rating: (i === 0 || i === 1) ? 1 : Math.floor(Math.random() * 3) + 3,
            sleep_hours: i === 1 ? 3 : 7.5,
            sleep_bedtime: bedtime,
            sleep_wake_time: wakeTime,
            sleep_quality: 4,
            exercise_minutes: i % 2 === 0 ? 45 : 0,
            exercise_type: i % 2 === 0 ? "Academia" : null,
            exercise_intensity: i % 2 === 0 ? "MÉDIA" : null,
            notes: `Registro de teste - Dia ${30 - i}`
        });
    }

    for (const log of logs) {
        await prisma.dailyLog.create({ data: log });
    }
    console.log('Created 30 daily logs');

    // 3. Prescriptions
    await prisma.prescription.createMany({
        data: [
            {
                patient_id: PATIENT_ID,
                medication_id: SERTRALINA_ID,
                dosage: "50mg",
                frequency: "1x ao dia (Manhã)",
                form: "Comprimido",
                duration: "Contínuo",
                start_date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
                is_active: true
            },
            {
                patient_id: PATIENT_ID,
                medication_id: QUETIAPINA_ID,
                dosage: "25mg",
                frequency: "1x ao dia (Noite)",
                form: "Comprimido",
                duration: "90 dias",
                start_date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
                is_active: true
            }
        ]
    });
    console.log('Created 2 active prescriptions');

    // 4. Therapeutic Plan
    await prisma.therapeuticPlan.create({
        data: {
            patient_id: PATIENT_ID,
            created_by: DOCTOR_ID,
            short_term_goals: JSON.stringify([
                { id: 1, title: "Higiene do sono", description: "Dormir 8h por dia", status: "IN_PROGRESS" },
                { id: 2, title: "Exercício", description: "3x por semana", status: "DONE" }
            ]),
            medium_term_goals: JSON.stringify([
                { id: 3, title: "Ansiedade", description: "Reduzir crises sociais", status: "IN_PROGRESS" }
            ]),
            strategies: "TCC e medicação regular"
        }
    });
    console.log('Created therapeutic plan');

    // 5. Alerts
    await prisma.alert.createMany({
        data: [
            {
                patient_id: PATIENT_ID,
                severity: "HIGH",
                trigger_source: "MOOD_DROP",
                status: "PENDING",
                created_at: new Date()
            },
            {
                patient_id: PATIENT_ID,
                severity: "MEDIUM",
                trigger_source: "SUICIDAL_IDEATION",
                status: "PENDING",
                created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
            }
        ]
    });
    console.log('Created patient alerts');

    // 6. Consultations
    await prisma.consultation.createMany({
        data: [
            {
                patient_id: PATIENT_ID,
                doctor_id: DOCTOR_ID,
                date_time: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                duration_minutes: 60,
                modality: "PRESENCIAL",
                status: "FINALIZED",
                diagnostic_hypothesis: "F33.1 - Transtorno depressivo recorrente",
                treatment_plan: "Manter Sertralina 50mg"
            }
        ]
    });
    console.log('Created past consultation');

    console.log('Seed finished successfully!');
}

main()
    .catch(e => {
        console.error('Seed fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
