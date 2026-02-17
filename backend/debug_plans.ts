
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING DEBUG SCRIPT (Loose Types) ---');

    try {
        const patients = await prisma.user.findMany({
            where: { role: 'PATIENT' },
            include: {
                patient_profile: {
                    include: {
                        therapeutic_plans: true
                    }
                }
            }
        });

        console.log(`Found ${patients.length} patients.`);

        for (const p of (patients as any[])) {
            console.log(`\nPatient: ${p.full_name} (ID: ${p.id})`);

            const profile = p.patientProfile || p.patient_profile;

            if (!profile) {
                console.log('  -> NO PROFILE FOUND');
                continue;
            }
            console.log(`  -> Profile ID: ${profile.id}`);

            const plans = profile.therapeuticPlans || profile.therapeutic_plans || [];
            console.log(`  -> Plans: ${plans.length}`);

            plans.forEach((plan: any) => {
                console.log(`    - PlanID: ${plan.id}`);
                console.log(`      Created: ${plan.created_at}`);
                console.log(`      Deleted: ${plan.deleted_at}`);
                console.log(`      Goals: ${plan.short_term_goals ? 'Present' : 'Null'}`);
            });
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- END DEBUG SCRIPT ---');
    }
}

main();
