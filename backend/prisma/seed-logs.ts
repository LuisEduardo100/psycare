
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const patientId = '95394962-0fa2-49cc-a34c-d6bdac910d08';

    console.log(`Seeding logs for Patient Profile ID: ${patientId}`);

    // Create date range for past 30 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to midnight UTC

    for (let i = 0; i < 30; i++) {
        const logDate = new Date(today);
        logDate.setDate(today.getDate() - i);

        const mood = Math.floor(Math.random() * 5) + 1; // 1-5
        const sleep = Math.floor(Math.random() * 5) + 5; // 5-9 hours

        await prisma.dailyLog.upsert({
            where: {
                patient_id_date: {
                    patient_id: patientId,
                    date: logDate,
                },
            },
            update: {
                mood_rating: mood,
                sleep_hours: sleep,
                notes: `Log gerado automaticamente para teste (Dia -${i})`,
            },
            create: {
                patient_id: patientId,
                date: logDate,
                mood_rating: mood,
                mood_level: Math.floor(Math.random() * 7) - 3, // -3 to +3
                anxiety_level: Math.floor(Math.random() * 4), // 0-3
                irritability_level: Math.floor(Math.random() * 4), // 0-3
                sleep_hours: sleep,
                sleep_quality: Math.floor(Math.random() * 5) + 1,
                notes: `Log gerado automaticamente para teste (Dia -${i})`,
            }
        });

        console.log(`Upserted log for ${logDate.toISOString().split('T')[0]}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
